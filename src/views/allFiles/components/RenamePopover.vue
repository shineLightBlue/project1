<template>
  <teleport to="body">
    <div v-if="visible" class="rename-popover" :style="popoverStyle" @click.stop>
      <el-input
        v-model="fileName"
        ref="inputRef"
        size="small"
        maxlength="80"
        @blur="handleBlur"
        @keyup.enter="handleConfirm"
        @keyup.esc="handleCancel"
      />
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ElInput, ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { apiFileRename } from '@/api'
import { useLoginStore } from '@/stores/login'
import type { Ref } from 'vue'

const { t } = useI18n()
const loginStore = useLoginStore()

type CloudFileItem = Record<string, any>

const props = defineProps<{
  visible: boolean
  file: CloudFileItem | null
  list: Ref<CloudFileItem[]>
}>()

const emit = defineEmits<{
  confirm: [fileUuid: string, newFileName: string]
  cancel: []
}>()

// 文件名状态
const fileName = ref('')
// 弹窗位置
const popoverPosition = ref({ x: 0, y: 0, width: 0 })
// 输入框引用
const inputRef = ref()

// 弹窗样式
const popoverStyle = computed(() => {
  return {
    left: popoverPosition.value.x + 'px',
    top: popoverPosition.value.y + 'px',
    width: popoverPosition.value.width + 'px',
  }
})

// 监听 visible 和 file 变化
watch(
  () => [props.visible, props.file],
  ([visible, file]) => {
    if (visible && file) {
      fileName.value = file?.displayName || file?.fileName || file?.name || ''
      calculatePosition(file)

      // 聚焦输入框
      nextTick(() => {
        if (inputRef.value) {
          ;(inputRef.value as HTMLElement).focus()
          ;(inputRef.value as HTMLInputElement).select()
        }
      })
    }
  },
  { immediate: true },
)

/**
 * 计算弹窗位置
 */
function calculatePosition(file: CloudFileItem) {
  const fileItem = document.querySelector(`[data-file-uuid="${file.fileUuid}"]`)
  if (fileItem) {
    const rect = fileItem.getBoundingClientRect()
    popoverPosition.value = {
      x: rect.left,
      y: rect.top,
      width: rect.width,
    }
  }
}

/**
 * 确认重命名
 */
async function handleConfirm() {
  if (!props.file) return
  if (!fileName.value.trim()) {
    ElMessage.warning(t('file.folderNameNotEmpty'))
    return
  }

  const oldFileName = props.file?.displayName || props.file?.fileName || ''
  const newFileName = fileName.value.trim()

  // 如果新旧文件名一致，直接关闭
  if (oldFileName === newFileName) {
    emit('cancel')
    return
  }

  try {
    await apiFileRename({
      fileUuid: props.file.fileUuid,
      displayName: newFileName,
      userId: loginStore.loginData.userId,
    })

    // 更新本地数据
    const fileInList = props.list.find((file) => file.fileUuid === props.file.fileUuid)
    if (fileInList) {
      fileInList.displayName = newFileName
      fileInList.fileName = newFileName
    }

    ElMessage.success(t('layout.secondaryNav.rename.renameSuccess'))
    emit('cancel')
  } catch (error) {
    console.error('重命名失败:', error)
    ElMessage.error(t('layout.secondaryNav.rename.renameFailed'))
  }
}

/**
 * 失去焦点时确认
 */
function handleBlur() {
  if (props.visible) {
    handleConfirm()
  }
}

/**
 * 取消重命名
 */
function handleCancel() {
  emit('cancel')
}
</script>

<style lang="scss" scoped>
.rename-popover {
  position: fixed;
  z-index: 9999;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 0 12px 4px rgba(60, 60, 60, 0.15);
  margin-top: 41px;
  margin-left: 32px;

  :deep(.el-input__inner) {
    height: 45px;
    font-size: 16px;
    color: #000;
  }

  :deep(.el-input__wrapper) {
    box-shadow: 0 0 0 1px #e5e5e5 inset;
    border-radius: 6px;
    padding-left: 12px;
    width: 319px;
  }
}
</style>
