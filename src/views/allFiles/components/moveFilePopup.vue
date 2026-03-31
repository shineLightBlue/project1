<template>
  <teleport to="body">
    <transition name="popup-fade">
      <div v-if="visible" class="move-file-popup" ref="popupRef" :style="popupStyle">
        <div class="popup-content">
          <!-- 全部文件 -->
          <div class="folder-item create-folder" v-if="showAll">
            <img :src="loadSvg('icon_file_black')" class="folder-icon" alt="folder" />
            <span class="folder-name">{{ t('layout.header.allFiles') }}</span>
            <img
              v-if="selectedFolderId === '0'"
              :src="loadSvg('icon_choose_file')"
              alt="selected"
            />
          </div>

          <!-- 横线分隔 -->
          <div class="divider" v-if="showAll"></div>
          <!-- 引入 SVG 雪碧图组件 -->
          <SpriteSvg />
          <!-- 文件夹列表 -->
          <div
            v-for="folder in folderList"
            :key="folder.id"
            class="folder-item"
            @click="moveToFolder(folder)"
          >
            <svg class="svg-icon" :style="{ color: getColor(folder.color) }">
              <use :href="'#' + folder.icon"></use>
            </svg>
            <span class="folder-name ellipsis">{{ folder.name }}</span>
            <img
              v-if="selectedFolderId === folder.id"
              :src="loadSvg('icon_choose_file')"
              alt="selected"
            />
          </div>

          <!-- 新建文件夹 -->
          <div class="folder-item create-folder" @click="showCreateFolder">
            <img :src="loadSvg('icon_file_newfile')" class="folder-icon" alt="folder" />
            <span class="folder-name">{{ t('layout.sidebar.addFolder') }}</span>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { apiCloudFolderList, apiFileMove } from '@/api'
import { useLoginStore } from '@/stores/login.ts'
import { loadSvg } from '@/utils'
import SpriteSvg from '@/components/SpriteSvg.vue'
import { folderColors } from '@/constants/folderColors.ts'
import eventBus from '@/utils/eventBus.ts'
import { useI18n } from 'vue-i18n'
import { useMoveFolderStore } from '@/stores/moveFolder.ts'

const route = useRoute()

const emit = defineEmits(['update:visible', 'confirm-move'])

const loginStore = useLoginStore()
const moveFolderStore = useMoveFolderStore()
const { t } = useI18n()

// props
const props = defineProps<{
  visible: boolean
  targetFileUuids: string[]
  parentIds: string[]
  position?: { x: number; y: number }
}>()

// 状态
const folderList = ref<any[]>([])
const popupRef = ref()
const selectedFolderId = ref('0') // 默认选中全部文件

const showAll = computed(() => !route.query.parentId)

// 弹窗尺寸常量
const POPUP_WIDTH = 320
const POPUP_MAX_HEIGHT = 400
const POPUP_ITEM_HEIGHT = 40
const POPUP_PADDING = 30

// 计算弹窗实际高度
const popupHeight = computed(() => {
  let itemCount = folderList.value.length + 1 // 文件夹列表 + 新建文件夹
  if (showAll.value) {
    itemCount += 2 // 全部文件 + 分隔线
  }
  const height = Math.min(POPUP_ITEM_HEIGHT * itemCount + POPUP_PADDING, POPUP_MAX_HEIGHT)
  return height
})

// 计算弹窗样式
const popupStyle = computed(() => {
  if (props.position) {
    // 使用传入的定位，并进行智能边界检测
    const { x, y } = props.position
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let adjustedX = x
    let adjustedY = y

    // 检测是否会超出右边界
    if (x + POPUP_WIDTH > viewportWidth) {
      adjustedX = x - POPUP_WIDTH - 10 // 向左偏移，留出 10px 间距
    }

    // 检测是否会超出底部边界
    if (y + popupHeight.value > viewportHeight) {
      adjustedY = y - popupHeight.value // 向上偏移
    }

    // 确保不会超出左边界
    if (adjustedX < 0) {
      adjustedX = 10
    }

    // 确保不会超出顶部边界
    if (adjustedY < 0) {
      adjustedY = 10
    }

    return {
      left: adjustedX + 'px',
      top: adjustedY + 'px',
      transform: 'none',
    }
  } else {
    // 默认居中显示
    return {
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
    }
  }
})

// 加载文件夹列表
async function loadFolderList() {
  try {
    const res = await apiCloudFolderList({
      userId: loginStore.loginData.userId,
    })
    if (res?.data) {
      folderList.value = res.data
    }
  } catch (error) {
    console.error('加载文件夹列表失败:', error)
  }
}

// 移动到文件夹
async function moveToFolder(obj: Record<string, any>) {
  if (selectedFolderId.value === obj.id) {
    emit('update:visible', false)
    return
  }
  try {
    // 更新选中状态
    selectedFolderId.value = obj.id

    // 调用 API 移动文件
    const paramsArr = props.targetFileUuids.map((item) => ({
      awsKey: '',
      fileUuid: item,
      parentId: obj.id,
      targetFolderName: obj.name,
      userId: loginStore.loginData.userId,
    }))
    await apiFileMove(paramsArr)

    closePopup()
    console.log(obj, 'confirm-move')
    emit('confirm-move', obj)
  } catch (error) {
    console.error('移动文件失败:', error)
    // ElMessage.error('移动文件失败')
  }
}

// 显示创建文件夹
function showCreateFolder() {
  emit('update:visible', false)
  eventBus.emit('openNewFolder')
  moveFolderStore.setMoveFolderStore(popupStyle.value)
}

// 关闭弹窗
function closePopup() {
  emit('update:visible', false)
}

// 监听弹窗显示状态
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      // 弹窗打开时，重置选中状态为默认的"全部文件"
      selectedFolderId.value = props.parentIds[0]
      loadFolderList()
    }
  },
)

// 监听键盘事件
function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    closePopup()
  }
}

// 点击外部关闭弹窗
function handleClickOutside(event: MouseEvent) {
  if (popupRef.value && !popupRef.value.contains(event.target as Node)) {
    closePopup()
  }
}

/**
 * 文件夹颜色
 * @param color
 */
function getColor(color: string) {
  let res = folderColors.find((val) => val.name === color)
  return res.value
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style lang="scss" scoped>
.move-file-popup {
  position: fixed;
  background: white;
  border-radius: 12px;
  width: 320px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  max-height: 400px;
  display: flex;
  flex-direction: column;
  z-index: 9999;
}

.popup-content {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
}

.folder-item {
  display: flex;
  align-items: center;
  padding: 5px 15px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 5px;

  &:hover {
    background: #ecebeb;
  }

  &.create-folder {
    padding: 10px 15px;

    .folder-name {
      color: #1890ff;
      font-weight: 500;
    }
  }
}

.folder-icon {
  width: 20px;
  height: 20px;
  margin: 0 5px;
  flex-shrink: 0;
}

.check-icon {
  width: 20px;
  height: 20px;
  margin-right: 12px;
  flex-shrink: 0;
}

.folder-name {
  flex: 1;
  font-size: 14px;
  color: #000;
  margin-left: 10px;
}

.divider {
  height: 1px;
  background: #e8e8e8;
  margin: 10px 0;
}

.add-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #1890ff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
  margin-right: 12px;
  flex-shrink: 0;
}

// 动画
.popup-fade-enter-active,
.popup-fade-leave-active {
  transition: all 0.3s ease;
}

.popup-fade-enter-from,
.popup-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.popup-fade-enter-to,
.popup-fade-leave-from {
  opacity: 1;
  transform: scale(1);
}
</style>
