<template>
  <el-dialog
    v-model="isDialogVisible"
    :title="t('dialogs.shareLink.title')"
    width="400px"
    :show-close="true"
    class="share-link-dialog"
    @close="closeDialog"
  >
    <div class="share-options">
      <div
        v-for="opt in shareOptions"
        :key="opt.value"
        class="share-option-item"
        :class="{ selected: opt.checked }"
        @click="opt.checked = !opt.checked"
      >
        <img :src="opt.icon" alt="" class="option-icon" />
        <span class="option-label">{{ shareOptionLabel(opt.value) }}</span>
        <div class="option-checkbox" :class="{ checked: opt.checked }">
          <el-icon v-if="opt.checked"><Check /></el-icon>
        </div>
      </div>
    </div>
    <p class="share-tip">{{ t('dialogs.shareLink.tip') }}</p>
    <template #footer>
      <el-button type="primary" class="copy-link-btn" :loading="isLoading" @click="handleCopyLink">
        {{ t('dialogs.shareLink.copyLink') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElIcon } from 'element-plus'
import { Check } from '@element-plus/icons-vue'
import { createShareLink } from '@/api/allFiles'
import { useLoginStore } from '@/stores/login'
import iconAudio from '@/assets/allfiles/icon_meeting_header_export_audio.svg'
import iconSummary from '@/assets/allfiles/icon_meeting_header_export_summary.svg'
import iconMindMap from '@/assets/allfiles/icon_meeting_header_export_mind_map-D4azFJz0.svg'
import iconTranscription from '@/assets/allfiles/icon_meeting_header_copy_transcribe.svg'

const props = defineProps<{
  visible: boolean
  transcribeId: string
}>()

const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void
}>()

const loginStore = useLoginStore()
const { t } = useI18n()

const isDialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

type ShareOptionValue = 'audio' | 'summary' | 'mindmap' | 'transcription'

const shareOptions = ref<
  { value: ShareOptionValue; icon: string; checked: boolean }[]
>([
  { value: 'audio', icon: iconAudio, checked: true },
  { value: 'summary', icon: iconSummary, checked: true },
  { value: 'mindmap', icon: iconMindMap, checked: true },
  { value: 'transcription', icon: iconTranscription, checked: true }
])

const isLoading = ref(false)

function shareOptionLabel(v: ShareOptionValue) {
  const key: Record<ShareOptionValue, string> = {
    audio: 'dialogs.shareLink.optionAudio',
    summary: 'dialogs.shareLink.optionSummary',
    mindmap: 'dialogs.shareLink.optionMindmap',
    transcription: 'dialogs.shareLink.optionTranscription'
  }
  return t(key[v])
}

watch(() => props.visible, (val) => {
  if (val) {
    shareOptions.value.forEach((o) => o.checked = true)
  }
})

function getShareTypes() {
  return shareOptions.value.filter((o) => o.checked).map((o) => o.value)
}

async function handleCopyLink() {
  const shareTypes = getShareTypes()
  if (!shareTypes.length) {
    ElMessage.warning(t('dialogs.shareLink.atLeastOne'))
    return
  }

  const userId = String(loginStore.loginData.userId ?? '')
  if (!userId) {
    ElMessage.warning(t('dialogs.shareLink.loginFirst'))
    return
  }

  if (!props.transcribeId) {
    ElMessage.warning(t('dialogs.shareLink.missingTranscribeId'))
    return
  }

  isLoading.value = true
  try {
    const res = await createShareLink({
      transcribeId: props.transcribeId,
      userId,
      shareTypes
    })
    const data = (res as any)?.data
    const shareId = data?.shareId as string | undefined
    const base = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/')
    const link = shareId
      ? `${window.location.origin}${base}share/${shareId}`
      : ''
    if (link) {
      await navigator.clipboard.writeText(link)
      ElMessage.success(t('dialogs.shareLink.linkCopied'))
      closeDialog()
    } else {
      ElMessage.warning(t('dialogs.shareLink.noLink'))
    }
  } catch (e) {
    console.error('Create share link failed:', e)
    ElMessage.error(t('dialogs.shareLink.createFailed'))
  } finally {
    isLoading.value = false
  }
}

function closeDialog() {
  emit('update:visible', false)
}
</script>

<style scoped lang="scss">
.share-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.share-option-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  background-color: #f5f7fa;

  &.selected {
    background-color: #ecf5ff;
  }

  &:hover {
    background-color: #ecf5ff;
  }

  .option-icon {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    margin-right: 12px;
  }

  .option-label {
    flex: 1;
    font-size: 14px;
    color: #333;
  }

  .option-checkbox {
    width: 20px;
    height: 20px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.2s;

    &.checked {
      background-color: #409eff;
      border-color: #409eff;

      .el-icon {
        color: #fff;
        font-size: 14px;
      }
    }
  }
}

.share-tip {
  margin-top: 16px;
  font-size: 12px;
  color: #999;
  line-height: 1.5;
}

.copy-link-btn {
  width: 100%;
}
</style>
