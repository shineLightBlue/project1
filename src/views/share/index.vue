<template>
  <div class="share-page">
    <!-- Header: logo + banner -->
    <header class="share-header" :style="{ backgroundImage: `url(${iconShareUrlBg})` }">
      <div class="share-header-left">
        <img :src="iconBoyaNotra" alt="BOYA Notra" class="share-logo" />
      </div>
      <div class="share-header-center share-banner">
        <img :src="iconProduct" alt="" class="share-ad-image" />
        <div class="share-ad-content">
          <p class="share-ad-text">{{ t('share.adText') }}</p>
          <a
            class="share-ad-button"
            href="https://www.boyamic.com/product/ai-voice-recorder-boya-notra"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ t('share.buyNow') }} →
          </a>
        </div>
      </div>
    </header>

    <main class="share-main">
      <div v-if="loading" class="share-state">{{ t('share.loading') }}</div>
      <div v-else-if="errorMessage" class="share-state share-error">{{ errorMessage }}</div>
      <template v-else-if="detail">
        <h1 class="share-title">{{ displayTitle }}</h1>

        <template v-if="visibleTabs.length">
          <div class="share-tabs">
            <button
              v-for="tab in visibleTabs"
              :key="tab"
              type="button"
              class="share-tab"
              :class="{ 'is-active': activeTab === tab }"
              @click="activeTab = tab"
            >
              {{ getTabLabel(tab) }}
            </button>
          </div>
          <div class="share-tab-body">
            <!-- 转写 Tab -->
            <div
              v-show="activeTab === 'transcription' && showTranscriptionTab"
              class="share-tab-pane"
            >
              <!-- 音频 + 转写：布局与图1一致，第一行 发言人+时间+播放，第二行 正文 -->
              <div class="share-tab-scroll">
              <CustomAudioPlayer
                v-if="detail.audioUrl"
                ref="audioPlayerRef"
                :src="detail.audioUrl"
                :sentence-infos="localSentenceInfos"
                :segment-marker-ms="jiayzProgressMarkersMs"
                :show-crop="false"
                class="share-audio-player-wrap"
                @pause="handleAudioEvent"
                @ended="handleAudioEvent"
              />
              <div v-if="!localSentenceInfos.length" class="share-transcript-empty">{{ t('share.noContent') }}</div>
              <div v-else class="share-transcript-list">
                <div
                  v-for="(sentence, idx) in localSentenceInfos"
                  :key="(sentence.startMs ?? 0) + '-' + idx"
                  class="share-transcription-item"
                  :class="{ 'is-editing': editingSentenceStartMs === sentence.startMs }"
                >
                  <div class="share-transcription-head">
                    <span
                      class="share-speaker-label"
                      @click="openEditSpeakerDialog(sentence)"
                    >{{ t('share.speaker') }}{{ sentence.speaker ?? '0' }}</span>
                    <span class="share-time">{{ sentence.start }}</span>
                    <button
                      v-if="detail.audioUrl"
                      type="button"
                      class="share-sentence-play-btn"
                      @click="toggleSentencePlayback(sentence)"
                    >
                      <img
                        :src="playingSentenceStartMs === sentence.startMs ? pauseIcon : playIcon"
                        class="share-sentence-play-icon"
                        alt=""
                      />
                    </button>
                  </div>
                  <div v-if="editingSentenceStartMs === sentence.startMs" class="share-transcription-edit">
                    <el-input
                      v-model="editingText"
                      type="textarea"
                      :rows="3"
                      autofocus
                      class="share-edit-textarea"
                    />
                    <div class="share-transcription-actions">
                      <el-button size="small" @click="cancelEditSentence">{{ t('common.cancel') }}</el-button>
                      <el-button type="primary" size="small" @click="saveEditSentence">{{ t('common.save') }}</el-button>
                    </div>
                  </div>
                  <div v-else class="share-transcription-body">
                    <p class="share-transcription-text">
                      <template
                        v-for="(seg, segIdx) in getSentenceTextSegments(sentence, idx)"
                        :key="segIdx"
                      >
                        <span v-if="seg.highlight" class="text-marker-highlight">{{ seg.text }}</span>
                        <template v-else>{{ seg.text }}</template>
                      </template>
                    </p>
                    <div class="share-transcription-actions share-transcription-actions--inline">
                      <el-tooltip :content="t('common.edit')" placement="top">
                        <el-button type="primary" link size="small" class="share-action-btn" @click="startEditSentence(sentence)">
                          <img src="@/assets/allfiles/iconedit.svg" :alt="t('common.edit')" class="share-action-icon default" />
                          <img src="@/assets/allfiles/iconedit_hover.svg" :alt="t('common.edit')" class="share-action-icon hover" />
                        </el-button>
                      </el-tooltip>
                      <el-tooltip :content="t('common.copy')" placement="top">
                        <el-button type="primary" link size="small" class="share-action-btn" @click="copySentenceText(sentence)">
                          <img src="@/assets/allfiles/iconcopy.svg" :alt="t('common.copy')" class="share-action-icon default" />
                          <img src="@/assets/allfiles/iconcopy_hover.svg" :alt="t('common.copy')" class="share-action-icon hover" />
                        </el-button>
                      </el-tooltip>
                    </div>
                  </div>
                </div>
              </div>
            </div>

    <!-- 编辑发言人弹窗 -->
    <el-dialog
      v-model="isEditSpeakerDialogVisible"
      :title="t('share.editSpeaker')"
      width="400px"
      :close-on-click-modal="false"
      class="share-edit-speaker-dialog"
    >
      <el-input v-model="editSpeakerName" :placeholder="t('share.speakerNamePlaceholder')" clearable />
      <el-radio-group v-model="editSpeakerScope" class="share-edit-speaker-scope">
        <el-radio :value="'current'">{{ t('share.applyToCurrent') }}</el-radio>
        <el-radio :value="'all'">{{ t('share.applyToAll') }}</el-radio>
      </el-radio-group>
      <template #footer>
        <el-button type="primary" @click="saveEditSpeaker">{{ t('common.save') }}</el-button>
      </template>
    </el-dialog>
            </div>

            <!-- 纪要 Tab：仅展示 content，纯只读，宽度与 tab 上方线条一致 -->
            <div
              v-show="activeTab === 'summary' && hasSummary"
              class="share-tab-pane"
            >
              <div class="share-tab-scroll share-tab-scroll--summary">
                <div class="share-tab-content">
                  <div
                    v-if="summaryMarkdown"
                    class="share-markdown-wrap markdown-body"
                    v-html="summaryMarkdownHtml"
                  />
                  <p v-else class="share-empty">{{ t('share.noContent') }}</p>
                </div>
              </div>
            </div>

            <!-- 导图 Tab：宽度与 tab 上方线条一致 -->
            <div
              v-show="activeTab === 'mindmap' && hasMindmap"
              class="share-tab-pane"
            >
              <div class="share-tab-scroll share-tab-scroll--mindmap">
                <div class="share-tab-content">
                  <!-- 仅切换到导图 tab 时再挂载 MindMapViewer，避免容器 hidden 时宽高为 0 导致 NaN -->
                  <div v-if="activeTab === 'mindmap' && xmindMarkdown" class="share-mindmap-wrap">
                    <MindMapViewer :markdown="xmindMarkdown" />
                  </div>
                  <p v-else-if="!xmindMarkdown" class="share-empty">{{ t('share.noContent') }}</p>
                </div>
              </div>
            </div>
          </div>
        </template>
        <p v-else class="share-empty">{{ t('share.noContent') }}</p>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { marked } from 'marked'
import { ElMessage } from 'element-plus'
import { getShareDetail, saveTranscribe, type ShareDetailData } from '@/api/allFiles'
import { analyzeFileHeader, isJyzAudioUrl } from '@/utils/fileHeader.ts'
import { sentenceTextSegmentsForJiayzMarkers } from '@/utils/jiayzMarkerHighlight.ts'
import { useLoginStore } from '@/stores/login'
import type { SentenceInfo } from '@/api/allFiles'

import iconBoyaNotra from '@/assets/allfiles/icon_boya_notra.svg'
import iconProduct from '@/assets/allfiles/icon_share_url_product_image.png'
import iconShareUrlBg from '@/assets/allfiles/icon_share_url_bg.svg'
import playIcon from '@/assets/allfiles/icon_transliteration_play.svg'
import pauseIcon from '@/assets/allfiles/icon_transliteration_pause.svg'
import CustomAudioPlayer from '@/components/CustomAudioPlayer.vue'

const MindMapViewer = defineAsyncComponent(() => import('@/components/MindMapViewer.vue'))

const route = useRoute()
const { t } = useI18n()
const loginStore = useLoginStore()

const loading = ref(true)
const errorMessage = ref('')
const detail = ref<ShareDetailData | null>(null)
const activeTab = ref('transcription')
const audioPlayerRef = ref<InstanceType<typeof CustomAudioPlayer> | null>(null)

const playingSentenceStartMs = ref<number | null>(null)
const editingSentenceStartMs = ref<number | null>(null)
const editingText = ref('')
const localSentenceInfos = ref<SentenceInfo[]>([])
/** 仅 .jyz 填充 JiayzTag.tagList（毫秒）；非 .jyz 恒为 [] */
const jiayzProgressMarkersMs = ref<number[]>([])
let jiayzMarkersFetchSeq = 0

const isEditSpeakerDialogVisible = ref(false)
const editSpeakerName = ref('')
const editSpeakerScope = ref<'current' | 'all'>('all')
const editSpeakerSentence = ref<SentenceInfo | null>(null)

const TAB_ORDER = ['transcription', 'summary', 'mindmap'] as const

const hasSummary = computed(() => detail.value?.shareTypes?.includes('summary'))
const hasMindmap = computed(() => detail.value?.shareTypes?.includes('mindmap'))
const hasAudio = computed(() => detail.value?.shareTypes?.includes('audio'))
const hasTranscription = computed(() => detail.value?.shareTypes?.includes('transcription'))

const showTranscriptionTab = computed(
  () => hasAudio.value || hasTranscription.value
)

const visibleTabs = computed(() => {
  const types = detail.value?.shareTypes ?? []
  return TAB_ORDER.filter((x) => {
    if (x === 'transcription') return types.includes('audio') || types.includes('transcription')
    if (x === 'summary') return types.includes('summary')
    if (x === 'mindmap') return types.includes('mindmap')
    return false
  })
})

function getTabLabel(tab: string) {
  if (tab === 'transcription') return t('share.tabTranscription')
  if (tab === 'summary') return t('share.tabSummary')
  if (tab === 'mindmap') return t('share.tabMindmap')
  return tab
}

const displayTitle = computed(() => {
  const title = detail.value?.summaryData?.title?.trim()
  if (title) return title
  return t('share.defaultTitle')
})

const summaryMarkdown = computed(() => detail.value?.summaryData?.content?.trim() ?? '')
const summaryMarkdownHtml = computed(() =>
  summaryMarkdown.value ? marked(summaryMarkdown.value) : ''
)
const xmindMarkdown = computed(() => detail.value?.summaryData?.xmind?.trim() ?? '')

function getSentenceTextSegments(sentence: SentenceInfo, idx: number | string) {
  return sentenceTextSegmentsForJiayzMarkers(
    sentence,
    Number(idx),
    localSentenceInfos.value,
    jiayzProgressMarkersMs.value
  )
}

watch(
  () => detail.value?.transcriptionData,
  (rows) => {
    if (!rows?.length) {
      localSentenceInfos.value = []
      return
    }
    localSentenceInfos.value = rows.map((r) => {
      const startMs = r.startMs ?? parseTimeToMs(r.start) ?? 0
      const endMs = r.endMs ?? parseTimeToMs(r.end) ?? startMs
      return {
        speaker: r.speaker ?? '0',
        text: (r.text ?? '').trim(),
        start: (r.start ?? '').trim(),
        end: (r.end ?? '').trim(),
        startMs,
        endMs,
      } as SentenceInfo
    })
  },
  { immediate: true }
)

watch(
  () => detail.value?.audioUrl,
  async (url) => {
    const u = url?.trim()
    if (!u || !isJyzAudioUrl(u)) {
      jiayzProgressMarkersMs.value = []
      return
    }
    const seq = ++jiayzMarkersFetchSeq
    try {
      const headerInfo = await analyzeFileHeader(u, 512)
      if (seq !== jiayzMarkersFetchSeq) return
      const tags = headerInfo.jiayzHeader?.tagList
      if (tags?.length) {
        jiayzProgressMarkersMs.value = [...new Set(tags)].sort((a, b) => a - b)
      } else {
        jiayzProgressMarkersMs.value = []
      }
    } catch {
      if (seq !== jiayzMarkersFetchSeq) return
      jiayzProgressMarkersMs.value = []
    }
  },
  { immediate: true }
)

function parseTimeToMs(s?: string): number | null {
  if (!s?.trim()) return null
  const parts = String(s).trim().split(':').map(Number)
  if (parts.length >= 3) {
    return parts[0] * 3600 * 1000 + parts[1] * 60 * 1000 + (parts[2] || 0) * 1000
  }
  if (parts.length === 2) return parts[0] * 60 * 1000 + (parts[1] || 0) * 1000
  if (parts.length === 1) return parts[0] * 1000
  return null
}

function formatTimeRange(start?: string, end?: string) {
  const a = (start ?? '').trim()
  const b = (end ?? '').trim()
  if (a && b) return `${a} — ${b}`
  return a || b || ''
}

function handleAudioEvent() {
  playingSentenceStartMs.value = null
}

function toggleSentencePlayback(sentence: SentenceInfo) {
  const startMs = sentence.startMs ?? 0
  if (playingSentenceStartMs.value === startMs) {
    audioPlayerRef.value?.pause()
    playingSentenceStartMs.value = null
  } else {
    audioPlayerRef.value?.seekAndPlay(startMs / 1000)
    playingSentenceStartMs.value = startMs
  }
}

function startEditSentence(sentence: SentenceInfo) {
  editingSentenceStartMs.value = sentence.startMs ?? null
  editingText.value = sentence.text ?? ''
}

function cancelEditSentence() {
  editingSentenceStartMs.value = null
  editingText.value = ''
}

async function saveEditSentence() {
  const startMs = editingSentenceStartMs.value
  if (startMs == null || !detail.value?.transcriptionId) return
  const userId = loginStore.loginData?.userId
  if (!userId) {
    ElMessage.warning(t('share.loginFirstToSave'))
    return
  }
  const idx = localSentenceInfos.value.findIndex((s) => (s.startMs ?? 0) === startMs)
  if (idx >= 0) {
    localSentenceInfos.value[idx] = { ...localSentenceInfos.value[idx], text: editingText.value }
  }
  try {
    await saveTranscribe({
      sentenceInfos: localSentenceInfos.value,
      transcribeId: detail.value.transcriptionId,
      userId,
    })
    ElMessage.success(t('share.saveSuccess'))
    cancelEditSentence()
  } catch {
    ElMessage.error(t('share.saveFailed'))
  }
}

async function copySentenceText(sentence: SentenceInfo) {
  const text = sentence.text ?? ''
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success(t('common.copySuccess'))
  } catch {
    ElMessage.error(t('common.copyFailed'))
  }
}

function openEditSpeakerDialog(sentence: SentenceInfo) {
  editSpeakerSentence.value = sentence
  editSpeakerName.value = String(sentence.speaker ?? '').trim()
  editSpeakerScope.value = 'all'
  isEditSpeakerDialogVisible.value = true
}

async function saveEditSpeaker() {
  const sentence = editSpeakerSentence.value
  if (!sentence || !detail.value?.transcriptionId) return
  const newName = editSpeakerName.value.trim()
  if (!newName) return
  const userId = loginStore.loginData?.userId
  if (!userId) {
    ElMessage.warning(t('share.loginFirstToSave'))
    return
  }
  const infos = [...localSentenceInfos.value]
  const targetSpeaker = sentence.speaker
  if (editSpeakerScope.value === 'current') {
    const idx = infos.findIndex((s) => (s.startMs ?? 0) === (sentence.startMs ?? 0))
    if (idx >= 0) infos[idx] = { ...infos[idx], speaker: newName }
  } else {
    for (const s of infos) {
      if (s.speaker === targetSpeaker) s.speaker = newName
    }
  }
  try {
    await saveTranscribe({
      sentenceInfos: infos,
      transcribeId: detail.value.transcriptionId,
      userId,
    })
    ElMessage.success(t('share.saveSuccess'))
    localSentenceInfos.value = infos
    isEditSpeakerDialogVisible.value = false
  } catch {
    ElMessage.error(t('share.saveFailed'))
  }
}

function pickDefaultTab() {
  const first = visibleTabs.value[0]
  activeTab.value = first ?? 'transcription'
}

async function load() {
  const shareId = String(route.params.shareId ?? '').trim()
  if (!shareId) {
    errorMessage.value = t('share.shareIdMissing')
    loading.value = false
    return
  }

  loading.value = true
  errorMessage.value = ''
  detail.value = null

  try {
    const res = (await getShareDetail(shareId)) as {
      code?: number
      data?: ShareDetailData
      msg?: string
      msgCode?: string
    }
    if (res?.code !== 200) {
      const msg = String(res?.msg ?? '').toLowerCase()
      if (/过期|expired|timeout|share/.test(msg) || String(res?.msgCode ?? '') === 'SHARE_TIMEOUT') {
        errorMessage.value = t('share.linkExpired')
      } else if (String(res?.msgCode ?? '').includes('NOT_FOUND') || /不存在|not found/i.test(msg)) {
        errorMessage.value = t('share.invalidOrExpired')
      } else if (/次数|limit|param/i.test(msg)) {
        errorMessage.value = t('share.reachLimit')
      } else {
        errorMessage.value = res?.msg || t('share.loadContentFailed')
      }
      return
    }
    detail.value = res.data ?? null
    if (!detail.value) {
      errorMessage.value = t('share.loadContentFailed')
      return
    }
    pickDefaultTab()
    const title = displayTitle.value
    if (title) document.title = `${title} · ${t('share.brand')}`
  } catch (e: unknown) {
    const err = e as { msg?: string; message?: string }
    const body = err?.msg ?? err?.message ?? ''
    const s = String(body).toLowerCase()
    if (/过期|expired/.test(s)) errorMessage.value = t('share.linkExpired')
    else errorMessage.value = body || t('share.loadContentFailed')
  } finally {
    loading.value = false
  }
}

watch(
  () => route.params.shareId,
  () => load()
)

onMounted(() => load())
onBeforeUnmount(() => {
  audioPlayerRef.value?.pause()
})
</script>

<style scoped lang="scss">
.share-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  background-color: var(--color-bg-primary);
  overflow: hidden;
}

.share-header {
  position: relative;
  flex-shrink: 0;
  height: clamp(150px, 7.8125vw, 150px);
  padding: clamp(14px, 0.7292vw, 14px) clamp(28px, 1.4583vw, 28px);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  box-sizing: border-box;
  z-index: 10;
}

.share-header-left {
  position: absolute;
  top: clamp(14px, 0.7292vw, 14px);
  left: clamp(28px, 1.4583vw, 28px);
}

.share-header-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: clamp(127px, 6.6146vw, 127px);
}

.share-logo {
  width: clamp(182px, 9.4792vw, 182px);
  height: auto;
  display: block;
}

.share-banner {
  display: flex;
  align-items: center;
}

.share-ad-image {
  width: clamp(115.66px, 6.024vw, 115.66px);
  height: clamp(118px, 6.1458vw, 118px);
  display: block;
  object-fit: contain;
}

.share-ad-content {
  display: flex;
  flex-direction: column;
  gap: clamp(14px, 0.7292vw, 14px);
}

.share-ad-text {
  margin: 0;
  font-family: PingFang SC, sans-serif;
  font-weight: 500;
  font-size: clamp(16px, 0.8333vw, 16px);
  line-height: clamp(22px, 1.1458vw, 22px);
  letter-spacing: 0;
  text-align: left;
  color: var(--color-text-primary);
}

.share-ad-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(9px, 0.4688vw, 9px);
  width: clamp(169.64px, 8.8354vw, 169.64px);
  height: clamp(35.46px, 1.8479vw, 35.46px);
  padding: 0;
  border: none;
  border-radius: clamp(6px, 0.3125vw, 6px);
  background: linear-gradient(
    to right,
    var(--color-ask-ai-gradient-start, #0051ff),
    var(--color-ask-ai-gradient-mid1, #0075ff),
    var(--color-ask-ai-gradient-mid2, #12acff),
    var(--color-ask-ai-gradient-end, #24e3ff)
  );
  cursor: pointer;
  font-family: PingFang SC, sans-serif;
  font-weight: 500;
  font-size: clamp(16px, 0.8333vw, 16px);
  line-height: clamp(22px, 1.1458vw, 22px);
  letter-spacing: 0;
  color: var(--color-button-text);
  text-decoration: none;
  transition: opacity 0.2s;
}

.share-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  margin: 0 auto;
  padding: 0;
  box-sizing: border-box;
  min-height: 0;
  overflow: hidden;
}

.share-title {
  flex-shrink: 0;
  margin: 0 auto;
  padding: clamp(30px, 1.5625vw, 30px) 0;
  font-family: PingFang SC, sans-serif;
  font-weight: 700;
  font-size: clamp(36px, 1.875vw, 36px);
  line-height: clamp(43px, 2.2396vw, 43px);
  letter-spacing: 0;
  text-align: center;
  color: var(--color-text-primary);
  display: block;
  width: clamp(1053px, 54.8438vw, 1053px);
  padding-left: clamp(20px, 1.0417vw, 20px);
  padding-right: clamp(20px, 1.0417vw, 20px);
  box-sizing: border-box;
  background-color: var(--color-bg-primary);
  z-index: 10;
}

.share-state {
  text-align: center;
  padding: 48px 16px;
  font-size: 15px;
  color: #666;
}

.share-error {
  color: #c45656;
}

/* tab 栏：与参考样式一致，不使用 el-tabs */
.share-tabs {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(35px, 1.8229vw, 35px);
  height: clamp(60px, 3.125vw, 60px);
  padding: 0;
  border-bottom: 1px solid var(--color-divider);
  width: clamp(1053px, 54.8438vw, 1053px);
  margin: 0 auto;
  padding-left: clamp(20px, 1.0417vw, 20px);
  padding-right: clamp(20px, 1.0417vw, 20px);
  box-sizing: border-box;
  background-color: var(--color-bg-primary);
  z-index: 10;
}

/* tab 内容区 */
.share-tab-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.share-tab-pane {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.share-tab-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 clamp(20px, 1.0417vw, 20px);
  box-sizing: border-box;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.25) transparent;
}

.share-tab-scroll::-webkit-scrollbar {
  width: 6px;
}

.share-tab-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.share-tab-scroll::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.25);
  border-radius: 3px;
}

.share-tab-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.4);
}

.share-tab-scroll--summary {
  padding-top: 4px;
}

.share-tab-scroll--mindmap {
  padding-top: 0;
}

/* 纪要和导图内容宽度比 tab 上方线条略小 */
.share-tab-content {
  width: 100%;
   max-width: clamp(1053px, 54.8438vw, 1053px);
  padding: 24px;
  box-sizing: border-box;
}

.share-tab-scroll--mindmap .share-tab-content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* 单个 tab 按钮：与参考一致 */
.share-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 0 clamp(4px, 0.2083vw, 4px);
  border: none;
  border-bottom: 2px solid transparent;
  background: none;
  cursor: pointer;
  font-family: PingFang SC, sans-serif;
  font-weight: 400;
  font-size: clamp(16px, 0.8333vw, 16px);
  line-height: clamp(22px, 1.1458vw, 22px);
  letter-spacing: 0px;
  text-align: center;
  color: var(--color-text-tertiary);
  transition: color 0.2s, font-weight 0.2s, border-color 0.2s;
}

.share-tab.is-active {
  color: #409eff;
  font-weight: 500;
  border-bottom-color: #409eff;
}

.share-audio-player-wrap {
  flex-shrink: 0;
  width: clamp(1053px, 54.8438vw, 1053px);
  max-width: 100%;
  margin:20px 0 24px 0;
}

.share-transcript-empty {
  color: #999;
  padding-top: 24px;
  font-size: 14px;
  align-self: flex-start;
}

.share-transcript-list {
  width: 100%;
  max-width: clamp(1053px, 54.8438vw, 1053px);
  padding: 24px;
  box-sizing: border-box;
}

.share-transcription-item {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }

  .share-transcription-text .text-marker-highlight {
    background: linear-gradient(
      180deg,
      transparent 0%,
      rgba(0, 81, 255, 0.2) 45%,
      rgba(0, 81, 255, 0.12) 100%
    );
    border-radius: 2px;
    box-decoration-break: clone;
    -webkit-box-decoration-break: clone;
  }

  &.is-editing {
    .share-transcription-edit {
      margin-top: 8px;
      padding: 12px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      background: #fff;
    }
  }
}

.share-transcription-head {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.share-speaker-label {
  color: #409eff;
  font-weight: 500;
  font-size: 14px;
  line-height: 1.5;
  cursor: pointer;

  &:hover {
    color: #66b1ff;
  }
}

.share-time {
  color: #909399;
  font-size: 14px;
  line-height: 1.5;
}

.share-sentence-play-btn {
  padding: 0;
  margin: 0;
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  .share-sentence-play-icon {
    width: 14px;
    height: 14px;
    display: block;
  }
}

.share-transcription-body {
  margin-top: 8px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.share-transcription-text {
  margin: 0;
  flex: 1;
  min-width: 0;
  color: #1a1a1a;
  font-size: 14px;
  line-height: 1.6;
  font-family: PingFang SC, sans-serif;
}

.share-transcription-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;

  &--inline {
    opacity: 0.6;
  }
}

.share-transcription-item:hover .share-transcription-actions--inline {
  opacity: 1;
}

.share-action-btn {
  padding: 4px;
  min-width: auto;
  position: relative;

  .share-action-icon {
    width: 16px;
    height: 16px;
    display: block;

    &.hover {
      display: none;
    }
  }

  &:hover .share-action-icon.default {
    display: none;
  }

  &:hover .share-action-icon.hover {
    display: block;
  }
}

.share-transcription-edit {
  .share-edit-textarea {
    font-size: 14px;
    margin-bottom: 8px;

    :deep(textarea),
    :deep(.el-textarea__inner) {
      padding: 0;
      border: none;
      box-shadow: none;
      background-color: transparent;
    }

    :deep(.el-input__wrapper) {
      box-shadow: none !important;
      padding: 0;
      background-color: transparent;
    }
  }
}

.share-edit-speaker-scope {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.share-markdown-wrap {
  min-height: 80px;
  font-size: 15px;
  line-height: 1.6;
  word-break: break-word;
}

.share-markdown-wrap.markdown-body :deep(h1),
.share-markdown-wrap.markdown-body :deep(h2),
.share-markdown-wrap.markdown-body :deep(h3) {
  margin-top: 1em;
  margin-bottom: 0.5em;
  font-weight: 600;
}

.share-markdown-wrap.markdown-body :deep(p) {
  margin: 0.5em 0;
}

.share-markdown-wrap.markdown-body :deep(ul),
.share-markdown-wrap.markdown-body :deep(ol) {
  margin: 0.5em 0;
  padding-left: 1.5em;
}

.share-markdown-wrap.markdown-body :deep(pre),
.share-markdown-wrap.markdown-body :deep(code) {
  background: #f5f7fa;
  border-radius: 4px;
}

.share-markdown-wrap.markdown-body :deep(pre) {
  padding: 12px;
  overflow-x: auto;
}

.share-markdown-wrap.markdown-body :deep(code) {
  padding: 2px 6px;
  font-size: 0.9em;
}

/* 占据剩余全部高度，MindMapViewer 内部会 syncSvgPixelSize 适配 */
.share-mindmap-wrap {
  flex: 1;
  min-height: 0;
  width: 100%;
  position: relative;
}

.share-empty {
  text-align: center;
  color: #909399;
  padding: 32px 8px;
  font-size: 14px;
}
</style>
