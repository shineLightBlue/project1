<template>
  <div class="l2-content-wrapper">
    <!-- 头部 -->
    <FileListHeader
      v-show="!isSelectionMode"
      :list-length="list.length"
      @sort-change="handleSortChange"
    />

    <!-- 全选 -->
    <SelectionBar
      v-if="isSelectionMode"
      :selected-count="selectedFiles.size"
      :total-count="list.length"
      @toggle-select-all="toggleSelectAll"
      @done="handleSelectionDone"
    />
    <!-- 选择功能： 合并、移至文件夹、删除、 回收站：恢复、永久删除 -->
    <SelectionActions
      v-if="isSelectionMode"
      @merge="handleMergeFiles"
      @move-to-folder="handleMoveToFolder"
      @delete="handleDeleteFiles"
      @restore="restore"
      @permanent-delete="deleteConfirmDialog = true"
    />

    <!-- 列表 -->
    <div class="file-list hide-scrollbar">
      <div v-if="isLoading" class="file-empty">{{ t('common.loading') }}</div>
      <template v-else>
        <div v-if="!list.length" class="file-empty">{{ t('common.noData') }}</div>
        <div
          class="file-item"
          v-for="item in list"
          :key="resolveFileKey(item)"
          :class="{
            active: selectedFile?.fileUuid === item.fileUuid,
            'selection-mode': isSelectionMode,
            selected: isFileSelected(item.fileUuid),
          }"
          :data-file-uuid="item.fileUuid"
          @click="handleFileClick(item)"
          @contextmenu.prevent.stop="handleFileContextMenu($event, item)"
        >
          <div class="file-item-content">
            <!-- 选择模式下的复选框 -->
            <img
              v-if="isSelectionMode"
              class="selection-checkbox"
              @click.stop="toggleFileSelection(item.fileUuid)"
              :src="
                isFileSelected(item.fileUuid)
                  ? loadSvg('icon_file_list_selected')
                  : loadSvg('icon_file_list_unselected')
              "
              alt="checkbox"
            />
            <!-- 内容区 -->
            <div class="file-info">
              <div class="file-name ellipsis">{{ resolveDisplayName(item) }}</div>
              <div class="time flex-center">
                <div>{{ item.fileTime }}</div>
                <div class="line">|</div>
                <div>{{ formatDuration(item.duration) }}</div>
              </div>
              <!-- 合并进度提示 -->
              <MergeProgressTip v-if="item.show && showMergeProgress" :progress="mergeProgress" />
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>

  <!-- 右键菜单 -->
  <FileContextMenu
    :visible="contextMenuVisible"
    :is-selection-mode="!isSelectionMode"
    :position="contextMenuPosition"
    @command="handleFileMenuCommand"
  />

  <!-- 重命名输入框弹层 -->
  <RenamePopover
    :visible="!!renamingFile"
    :file="renamingFile"
    :list="list"
    @cancel="renamingFile = null"
  />

  <!-- 合并、移动成功通知 -->
  <ToastView v-model="showToast" :data="toastData" @mergeView="mergeView" />

  <!-- 移动文件弹窗 -->
  <MoveFilePopup
    v-model:visible="moveFileShow"
    :target-file-uuids="fileUuidArr"
    :parentIds="moveFileParentIds"
    :position="contextMenuPosition"
    @confirm-move="confirmMove"
  />

  <!-- 删除确认框 -->
  <DeleteDialog
    v-model="deleteConfirmDialog"
    :title="t('layout.secondaryNav.permanentDelete.confirmTitle')"
    @confirm-delete="deleteApi('1', Array.from(selectedFiles))"
  >
    <p>{{ t('layout.secondaryNav.permanentDelete.confirmMessage') }}</p>
  </DeleteDialog>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { apiCloudList, apiCloudRestoreFile, apiFileRemove, apiRecycleList } from '@/api'
import { loadSvg } from '@/utils'
import { useLoginStore } from '@/stores/login'
import { useCloudStore } from '@/stores/cloud'
import { useFileMerge } from './composables/useFileMerge'

import MoveFilePopup from '@/views/allFiles/components/moveFilePopup.vue'
import ToastView from '@/views/allFiles/components/toastView.vue'
import FileListHeader from './components/FileListHeader.vue'
import FileContextMenu from './components/FileContextMenu.vue'
import MergeProgressTip from './components/MergeProgress.vue'
import SelectionActions from './components/SelectionActions.vue'
import RenamePopover from './components/RenamePopover.vue'
import SelectionBar from './components/SelectionBar.vue'
import eventBus from '@/utils/eventBus.ts'
import DeleteDialog from '@/components/deleteDialog.vue'

const route = useRoute()
const emit = defineEmits<{
  'file-selected': [item: CloudFileItem]
}>()

type CloudFileItem = Record<string, any>

const { t } = useI18n()
const loginStore = useLoginStore()
const cloudStore = useCloudStore()
const router = useRouter()

//================  ref 定义

const list = ref<CloudFileItem[]>([]) // 列表
const isLoading = ref(false)
const selectedFile = ref<CloudFileItem | null>([]) // 单选选中的文件
const sortType = ref(2) // 1-创建时间 2-更新时间 3-最近打开

// 右键菜单相关
const contextMenuVisible = ref(false)
const contextMenuFile = ref<CloudFileItem | null>(null)
const contextMenuPosition = ref({ x: 0, y: 0 })

// 重命名相关
const renamingFile = ref<CloudFileItem | null>(null)

// 选择模式相关
const isSelectionMode = ref(false)
const selectedFiles = ref<Set<string>>(new Set())

// 合并进度相关
const showMergeProgress = ref(false)

// Toast通知相关
const showToast = ref(false)
const toastData = ref()

// 移动文件弹窗
const moveFileShow = ref(false)
const fileUuidArr = ref([])
const moveFileParentIds = ref([])

//=========  watch
watch(
  () => route.query,
  () => {
    route.query.type && init()
  },
  { immediate: true },
)
watch(
  () => cloudStore.refreshVersion,
  () => loadFiles(),
)

/**
 * init
 */
function init() {
  const isRecycle = route.query.type === 'recycle'
  selectedFile.value = [] // 重置
  emit('file-selected', '') // 重置
  if (isRecycle) {
    getRecycleList()
  } else {
    loadFiles()
  }
}

/**
 * 排序改变
 * @param sortTypeValue 排序类型：1-创建时间 2-更新时间 3-最近打开
 */
function handleSortChange(sortTypeValue: number) {
  if (route.query.type === 'recycle') {
    return
  }
  sortType.value = sortTypeValue
  void loadFiles()
}

//=============   列表
/**
 * 加载文件
 */
async function loadFiles() {
  const userId = String(loginStore.loginData.userId ?? '').trim()
  if (!userId) {
    list.value = []
    return
  }
  isLoading.value = true
  try {
    const res = await apiCloudList({
      sortType: sortType.value,
      parentId: route.query.parentId || '0',
      userId,
    })
    list.value = res.data // 直接显示
    filterFilesByType()
  } catch {
    list.value = []
  } finally {
    isLoading.value = false
  }
}

/**
 * 未分类文件过滤
 */
function filterFilesByType() {
  // 根据路由参数判断是否为未分类
  const isNoSort = route.query.type === 'unclassified'
  const isImport = route.query.type === 'import' // 导入

  if (isNoSort) {
    list.value = list.value.filter((val) => val.parentId === '0')
  } else if (isImport) {
    list.value = list.value.filter((val) => val.uploadType === '3')
  }
}

/**
 * 文件点击
 * @param item
 */
async function handleFileClick(item: CloudFileItem) {
  if (isSelectionMode.value) {
    // 选择模式下切换选择状态
    toggleFileSelection(item.fileUuid)
  } else {
    // 正常模式选中文件
    selectedFile.value = item
    const data = route.query.type !== 'recycle' ? item : ''
    emit('file-selected', data)
  }
}

/**
 * 时长格式化
 * @param num
 */
function formatDuration(num: number) {
  const minutes = Math.floor(num / 60)
  const seconds = num % 60

  if (minutes > 0 && seconds > 0) {
    return `${minutes}min ${seconds}s`
  } else if (minutes > 0) {
    return `${minutes}min`
  } else if (seconds > 0) {
    return `${seconds}s`
  } else {
    return '0s'
  }
}

/**
 * 列表 名
 * @param item
 */
function resolveDisplayName(item: CloudFileItem) {
  return item?.displayName || item?.fileName || item?.name || '-'
}

function resolveFileKey(item: CloudFileItem) {
  return item?.fileUuid || item?.id || item?.awsKey || resolveDisplayName(item)
}

// 根据路由参数判断是否需要缓存
/*const _needCache = ref<boolean>(
  ['all', 'unclassified', 'import'].includes(route.query.type as string),
)*/

//===============   右键菜单
/**
 * 点击右键菜单
 * @param event
 * @param item
 */
function handleFileContextMenu(event: MouseEvent, item: CloudFileItem) {
  event.preventDefault()
  event.stopPropagation()
  contextMenuFile.value = item
  contextMenuPosition.value = { x: event.clientX, y: event.clientY }
  contextMenuVisible.value = true

  const closeContextMenu = (e: MouseEvent) => {
    const menuElement = document.querySelector('.file-context-menu')
    if (menuElement && !menuElement.contains(e.target as Node)) {
      contextMenuVisible.value = false
      document.removeEventListener('click', closeContextMenu)
    }
  }

  setTimeout(() => {
    document.addEventListener('click', closeContextMenu)
  }, 0)
}

/**
 * 点击右键菜单 功能
 * @param command
 */
function handleFileMenuCommand(command: string) {
  if (!contextMenuFile.value) return

  console.log('右键菜单操作:', command, contextMenuFile.value)

  switch (command) {
    case 'select':
      selectedFile.value = contextMenuFile.value
      enterSelectionMode()
      break
    case 'rename':
      renamingFile.value = contextMenuFile.value
      break
    case 'move':
      fileUuidArr.value = [contextMenuFile.value.fileUuid]
      moveFileParentIds.value = [contextMenuFile.value.parentId]
      moveFileShow.value = true
      break
    case 'delete':
      console.log('移至回收站:')
      deleteApi()
      break
    // 回收站恢复
    case 'restore':
      console.log('回收站恢复:')
      restore(true)
      break
    // 回收站永久删除
    case 'permanentDelete':
      console.log('回收站永久删除:')
      deleteConfirmDialog.value = true
      break
  }

  contextMenuVisible.value = false
}

//===============   选择逻辑
/**
 * 全选切换
 */
function toggleSelectAll() {
  if (selectedFiles.value.size === list.value.length) {
    // 全部取消选择
    selectedFiles.value.clear()
  } else {
    // 全部选择
    list.value.forEach((file) => {
      selectedFiles.value.add(file.fileUuid)
    })
  }
}

/**
 * 多选
 * @param fileUuid
 */
function toggleFileSelection(fileUuid: string) {
  if (selectedFiles.value.has(fileUuid)) {
    selectedFiles.value.delete(fileUuid)
  } else {
    selectedFiles.value.add(fileUuid)
  }
}

/**
 * 开启多选
 */
function enterSelectionMode() {
  isSelectionMode.value = true
  selectedFiles.value.clear()
  selectedFiles.value.add(contextMenuFile.value.fileUuid)
}

/**
 * 选择 完成
 */
function handleSelectionDone() {
  isSelectionMode.value = false
  selectedFiles.value.clear()
}

/**
 * 选中判断
 * @param fileUuid
 */
function isFileSelected(fileUuid: string) {
  return selectedFiles.value.has(fileUuid)
}

//===============   删除恢复
/**
 * 删除确认框
 */
const deleteConfirmDialog = ref(false)

/**
 * 批量删除文件
 */
function handleDeleteFiles() {
  if (selectedFiles.value.size === 0) {
    ElMessage.warning('请先选择文件')
    return
  }
  deleteApi('2', Array.from(selectedFiles.value))
}

/**
 * 删除文件 api
 */
function deleteApi(type?: string, list?: any[]) {
  const files = list?.length
    ? list.map((item) => ({ userId: loginStore.loginData.userId, fileUuid: item }))
    : [
        {
          userId: loginStore.loginData.userId,
          fileUuid: contextMenuFile.value.fileUuid,
        },
      ]
  apiFileRemove({
    action: type || '2', // 1 删除 2 移至回收站
    userFiles: files,
  }).then((res) => {
    console.log('移至回收站api:', res)
    // 删除
    if (type === '1') {
      ElMessage.success(t('layout.secondaryNav.permanentDelete.deleteSuccess'))
      getRecycleList()
      handleSelectionDone()
      deleteConfirmDialog.value = false
    } else {
      // 移至回收站
      ElMessage.success(t('layout.secondaryNav.delete.deleteSuccess'))
      // 更新列表
      loadFiles()
      handleSelectionDone()
    }
  })
}

/**
 * 恢复
 */
async function restore(rightMenu?: boolean) {
  let arr = [{ fileUuid: contextMenuFile.value.fileUuid, userId: loginStore.loginData.userId }]
  if (!rightMenu) {
    arr = Array.from(selectedFiles.value).map((item) => ({
      fileUuid: item,
      userId: loginStore.loginData.userId,
    }))
  }
  await apiCloudRestoreFile(arr)
  ElMessage.success(
    t('layout.secondaryNav.restore.restoreSuccess', {
      fileName: contextMenuFile.value.displayName,
    }),
  )
  getRecycleList()
  handleSelectionDone()
}

/**
 * 回收站接口
 */
function getRecycleList() {
  apiRecycleList({
    folderName: '0',
    userId: loginStore.loginData.userId,
  }).then((res) => {
    console.log('回收站', res)
    list.value = res.data
  })
}

//===================  文件移动
/**
 * 移至文件夹
 */
function handleMoveToFolder(event: MouseEvent) {
  if (selectedFiles.value.size === 0) {
    ElMessage.warning('请先选择文件')
    return
  }
  contextMenuPosition.value = { x: event.clientX, y: event.clientY }
  fileUuidArr.value = Array.from(selectedFiles.value)
  moveFileParentIds.value = []
  moveFileShow.value = true
}

/**
 * 文件移动成功提示
 */
function confirmMove(obj: Record<string, any>) {
  handleSelectionDone() // 多选  点完成

  // 更新 list.value 中对应文件的 parentId
  fileUuidArr.value.forEach((fileUuid: string) => {
    const file = list.value.find((item) => item.fileUuid === fileUuid)
    if (file) {
      file.parentId = obj.id
      console.log(`更新文件 ${fileUuid} 的 parentId 为 ${obj.id}`)
    }
  })

  // 从 list.value 中获取对应的文件 displayName
  const displayNames = list.value
    .filter((file) => fileUuidArr.value.includes(file.fileUuid))
    .map((file) => resolveDisplayName(file))

  const mes = t('layout.secondaryNav.move.etc') // 等
  toastData.value = {
    type: 'move',
    fileName: displayNames.length > 1 ? displayNames[0] + mes : displayNames[0], // 将所有文件名拼接
    folderName: obj.name,
    parentId: obj.id,
  }
  showMergeSuccessNotification() // 提示
}

//==========   文件合并逻辑
const mergeFileName = ref('') // 合并文件名
const { mergeProgress, mergeFiles, scrollItem, getFileUrl, getDay } = useFileMerge({
  mergeFileName,
  mergeSuccess,
})

/**
 * 文件合并操作
 */
async function handleMergeFiles() {
  if (selectedFiles.value.size === 0) {
    ElMessage.warning('请先选择文件')
    return
  }
  if (selectedFiles.value.size !== 2) {
    ElMessage.warning(t('layout.secondaryNav.merge.onlyTwoFiles'))
    return
  }

  // 从 list.value 中获取选中的文件
  const selectedFileItems = list.value.filter((file) => selectedFiles.value.has(file.fileUuid))

  // 获取 fileUrl
  const fileUrls = selectedFileItems.map((file) => file.ossKey)

  console.log('合并文件UUID:', Array.from(selectedFiles.value))
  console.log('选中的文件:', selectedFileItems)
  console.log('文件URL:', fileUrls)

  // 可以在这里调用合并函数，传入 fileUrls
  let url1 = await getFileUrl(fileUrls[0])
  let url2 = await getFileUrl(fileUrls[1])
  console.log(url1, 'url1')
  console.log(url2, 'url2')
  handleSelectionDone()
  showMergeProgress.value = true // 显示合并loading
  const time = getDay()
  mergeFileName.value = t('layout.secondaryNav.merge.mergeFile') + time
  list.value.unshift({
    fileTime: time,
    duration: 1000,
    name: mergeFileName.value,
    show: true,
  })

  mergeFiles([url1, url2])
}

/**
 * 合并成功
 */
async function mergeSuccess() {
  await loadFiles()
  toastData.value = {
    type: 'merge',
  }
  showMergeSuccessNotification()
}

/**
 * 合并查看
 */
function mergeView() {
  const item = list.value.find(
    (val) => val.displayName.replace(/\.[^.]+$/, '') === mergeFileName.value,
  )
  handleFileClick(item) // 点击
  scrollItem(item.fileUuid) // 滚动
}

/**
 * 显示合并、移动成功通知
 */
function showMergeSuccessNotification() {
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 4000)
}

onMounted(() => {
  eventBus.on('showMoveFilePopup', () => {
    moveFileShow.value = true
  })
  // 如果没有 type 参数，默认设置为 all
  if (!route.query.type) {
    router.replace({ query: { type: 'all' } })
  }
})

//============== 导出
/**
 * 刷新数据
 */
function refreshFiles() {
  loadFiles()
}

/** 同步左侧文件列表中的反馈状态（点赞/点踩后更新展示） */
function patchFileFeedback(fileUuid: string, feedback: string) {
  const file = list.value.find((item) => item.fileUuid === fileUuid)
  if (file) {
    file.feedback = feedback
  }
}

/**
 * 转写最右侧 移至文件夹弹窗
 * @param obj
 */
function showMoveFolder(obj: Record<string, any>) {
  console.log('showMoveFolder', obj)

  // 如果找不到，使用传入的对象
  moveFileShow.value = true
  fileUuidArr.value = [obj.fileUuid]
  moveFileParentIds.value = [obj.parentId]
  contextMenuPosition.value = {
    x: window.innerWidth - 400,
    y: 70,
  }
}

defineExpose({ refreshFiles, showMoveFolder, deleteApi, patchFileFeedback })
</script>

<style lang="scss" scoped>
.l2-content-wrapper {
  width: 339px;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  background: #f8f8f8;

  .file-list {
    overflow-y: auto;
    flex-grow: 1;
    padding: 0 10px;
  }
}

.file-empty {
  text-align: center;
  padding: 15px 20px;
  color: #999;
}

.file-item {
  padding: 20px 10px;
  cursor: pointer;
  border-radius: 6px;
  background: #fff;
  margin-bottom: 10px;
  box-shadow: 0 0 4px 0 rgba(0, 0, 0, 0.05);

  .file-item-content {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
  }

  .file-info {
    flex: 1;
    min-width: 0;
    overflow: hidden;
  }

  .file-name {
    margin-bottom: 5px;
  }

  .time {
    color: rgba(0, 0, 0, 0.5);
    font-size: 10px;
    margin-top: 5px;
  }

  .line {
    margin: 0 5px;
  }

  &:hover,
  &.active {
    background-color: #d6e8ff;
  }
}

.file-item {
  &.selection-mode {
    &:hover {
      background-color: #d6e8ff;
    }

    &.selected {
      background-color: #d6e8ff;
    }
  }

  .selection-checkbox {
    flex-shrink: 0;
    cursor: pointer;
    width: 15px;
    height: 15px;
  }
}
</style>
