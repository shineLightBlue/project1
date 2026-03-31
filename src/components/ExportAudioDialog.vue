<template>
  <el-dialog
    v-model="isDialogVisible"
    :title="t('dialogs.exportAudio.title')"
    width="400px"
    :show-close="true"
    class="export-audio-dialog"
    @close="closeDialog"
  >
    <div class="export-format-label">{{ t('dialogs.exportAudio.exportAs') }}</div>
    <div class="format-options">
      <div
        v-for="opt in formatOptions"
        :key="opt.value"
        class="format-option-item"
        :class="{ selected: selectedFormat === opt.value }"
        @click="selectedFormat = opt.value"
      >
        <img :src="opt.icon" alt="" class="format-icon" />
        <span class="format-name">{{ opt.label }}</span>
        <el-icon v-if="selectedFormat === opt.value" class="format-check"><Check /></el-icon>
      </div>
    </div>
    <template #footer>
      <el-button type="primary" class="export-btn" :loading="isExporting" @click="handleExport">
        {{ t('dialogs.exportAudio.export') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElIcon } from 'element-plus'
import { Check } from '@element-plus/icons-vue'
import { getDownloadUrl } from '@/api/allFiles'
import iconMp3 from '@/assets/allfiles/icon_export_mp3.svg'
import iconWav from '@/assets/allfiles/icon_export_wav.svg'

const props = defineProps<{
  visible: boolean
  ossKey: string
  fileName?: string
}>()

const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void
}>()

const { t } = useI18n()

const isDialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const formatOptions = [
  { value: 'mp3' as const, label: 'MP3', icon: iconMp3 },
  { value: 'wav' as const, label: 'WAV', icon: iconWav }
]

const selectedFormat = ref<'mp3' | 'wav'>('mp3')
const isExporting = ref(false)

watch(() => props.visible, (val) => {
  if (val) {
    selectedFormat.value = 'mp3'
  }
})

async function handleExport() {
  if (!props.ossKey) {
    ElMessage.warning(t('dialogs.exportAudio.noAudio'))
    return
  }

  isDialogVisible.value = false
  ElMessage.info(t('dialogs.exportAudio.exporting'))

  isExporting.value = true
  try {
    const res = await getDownloadUrl(props.ossKey)
    const url = (res as any)?.data?.url ?? ''
    if (!url) {
      ElMessage.error(t('dialogs.exportAudio.downloadUrlFailed'))
      return
    }

    const ext = selectedFormat.value === 'mp3' ? '.mp3' : '.wav'
    const filename = `${props.fileName?.replace(/\.[^.]+$/, '') || t('dialogs.exportAudio.defaultFileName')}${ext}`

    let blob: Blob
    try {
      const response = await fetch(url)
      blob = await response.blob()
    } catch {
      ElMessage.error(t('dialogs.exportAudio.fetchAudioFailed'))
      return
    }

    // 优先使用 File System Access API 弹出系统保存对话框，让用户选择下载路径
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description: selectedFormat.value === 'mp3' ? t('dialogs.exportAudio.filePickerMp3') : t('dialogs.exportAudio.filePickerWav'),
              accept: selectedFormat.value === 'mp3'
                ? { 'audio/mpeg': ['.mp3'] }
                : { 'audio/wav': ['.wav'] }
            }
          ]
        })
        const writable = await handle.createWritable()
        await writable.write(blob)
        await writable.close()
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          return // 用户取消选择保存路径
        }
        throw err
      }
    } else {
      // 不支持 showSaveFilePicker 时降级为 a 标签下载
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    }

    ElMessage.success(t('dialogs.exportAudio.exportDone'))
  } catch (e) {
    console.error('Export audio failed:', e)
    ElMessage.error(t('dialogs.exportAudio.exportFailed'))
  } finally {
    isExporting.value = false
  }
}

function closeDialog() {
  emit('update:visible', false)
}
</script>

<style scoped lang="scss">
.export-format-label {
  font-size: 14px;
  color: #333;
  margin-bottom: 12px;
}

.format-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.format-option-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  background-color: #fff;
  border: 1px solid #e8e8e8;

  &.selected {
    background-color: #ecf5ff;
    border-color: #409eff;
  }

  &:hover {
    background-color: #f5f7fa;
  }

  .format-icon {
    width: 24px;
    height: 24px;
    margin-right: 12px;
  }

  .format-name {
    flex: 1;
    font-size: 14px;
    color: #333;
  }

  .format-check {
    color: #409eff;
    font-size: 18px;
  }
}

.export-btn {
  width: 100%;
}
</style>
