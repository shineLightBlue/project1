<template>
  <el-dialog
    v-model="isDialogVisible"
    :show-close="false"
    width="80%"
    top="5vh"
    class="audio-editor-dialog"
    @opened="onDialogOpened"
    @close="onDialogClose"
  >
    <div class="audio-editor-body">
    <div class="editor-container">
      <div class="editor-header">
        <span class="file-name" :title="fileName">{{ fileName }}</span>
        <div class="tool-actions">
          <button class="editor-tool-btn" :disabled="!hasSelection" @click="cutRegion" :title="t('dialogs.audioEditor.cropTitle')">
            <img :src="iconCrop" :alt="t('dialogs.audioEditor.cropAlt')" />
          </button>
          <button class="editor-tool-btn" :disabled="!hasSelection" @click="deleteRegion">
            <img :src="iconDelete" :alt="t('common.delete')" />
          </button>
        </div>
        <div class="header-right">
          <el-button @click="closeDialog">{{ t('common.cancel') }}</el-button>
          <el-button type="primary" @click="handleSaveAs">{{ t('common.saveAs') }}</el-button>
        </div>
      </div>

      <div class="waveform-section">
        <div ref="timelineRef" class="timeline-container"></div>
        <div
          ref="waveformRef"
          class="waveform-container"
          @mousemove="handleWaveformMouseMove"
          @mouseleave="handleWaveformMouseLeave"
          @click="handleWaveformClick"
        >

          <div
            v-if="hoverLineVisible"
            class="hover-line"
            :style="{ left: `${hoverLineX}px` }"
          >
            <span class="hover-time">{{ formatTimeMMSS(hoverLineTime) }}</span>
          </div>
        </div>
      </div>

      <div class="editor-footer">
        <span class="time-display">{{ formattedCurrentTime }} / {{ formattedDuration }}</span>
        <div class="play-btn" @click="playPause">
          <img v-if="isPlaying" :src="iconPause" :alt="t('common.pause')" class="play-btn-icon" />
          <img v-else :src="iconPlay" :alt="t('common.play')" class="play-btn-icon" />
        </div>
        <div class="zoom-controls">
          <img :src="iconShrink" :alt="t('common.zoomOut')" class="zoom-icon" @click="zoomOut" />
          <input
            type="range"
            min="20"
            max="400"
            step="1"
            :value="zoomLevel"
            @input="handleZoomChange"
            class="zoom-slider"
          />
          <img :src="iconMagnify" :alt="t('common.zoomIn')" class="zoom-icon" @click="zoomIn" />
        </div>
      </div>
    </div>

    <div v-if="isAudioLoading" class="audio-loading-overlay">
      <div class="audio-loading-content">
        <div class="audio-loading-row">
          <el-icon class="audio-loading-icon is-loading">
            <Loading />
          </el-icon>
          <span class="audio-loading-text">{{ t('dialogs.audioEditor.loadingText', { progress: audioLoadProgress }) }}</span>
        </div>
        <p class="audio-loading-hint">{{ t('dialogs.audioEditor.loadingHint') }}</p>
      </div>
    </div>

    <div v-if="processing" class="processing-overlay">
      <div class="processing-indicator">
        <span class="processing-spinner"></span>
        {{ processingMessage }}
      </div>
    </div>
    </div>

    <el-dialog
      v-model="saveDialogVisible"
      :title="t('dialogs.audioEditor.saveAsNewTitle')"
      width="480px"
      append-to-body
      :show-close="true"
      class="save-as-dialog"
    >
      <p class="save-hint" v-html="saveDialogHint"></p>
      <div class="save-field">
        <label>{{ t('dialogs.audioEditor.fileNameLabel') }}</label>
        <el-input v-model="saveFileName" type="textarea" :rows="2" />
      </div>
      <template #footer>
        <el-button @click="saveDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="confirmSave">{{ t('common.save') }}</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import WaveSurfer from 'wavesurfer.js'
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js'
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.esm.js'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { ElMessage } from 'element-plus'
import iconShrink from '@/assets/allfiles/icon_editingpopup_crop_shrink.svg'
import iconMagnify from '@/assets/allfiles/icon_editingpopup_crop_magnify.svg'
import iconCrop from '@/assets/allfiles/icon_editingpopup_crop.svg'
import iconDelete from '@/assets/allfiles/icon_editingpopup_crop_delete.svg'
import iconHandle from '@/assets/allfiles/icon_editingpopup_crop_handle.svg'
import iconPlay from '@/assets/allfiles/icon_transliteration_play.svg'
import iconPause from '@/assets/allfiles/icon_transliteration_pause.svg'
import { Loading } from '@element-plus/icons-vue'
import { getStsToken } from '@/api/allFiles/index'
import { useLoginStore } from '@/stores/login'

const props = defineProps<{
  visible: boolean
  audioUrl: string
  fileName: string
}>()

const emit = defineEmits(['update:visible', 'save'])
const loginStore = useLoginStore()
const { t } = useI18n()

const isDialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const waveformRef = ref<HTMLDivElement>()

const timelineRef = ref<HTMLDivElement>()
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const hasSelection = ref(false)
const selectedRegion = ref<any>(null)
const processing = ref(false)
const processingMessage = ref('')
/** 与波形区 zoom 滑块 min/max 一致 */
const ZOOM_MIN_PCT = 20
const ZOOM_MAX_PCT = 400
const zoomLevel = ref(50)
const hoverLineVisible = ref(false)
const hoverLineX = ref(0)
const hoverLineTime = ref(0)
const saveDialogVisible = ref(false)
const saveFileName = ref('')
const saveDialogIsCut = ref(false)
const saveDialogHint = computed(() =>
  saveDialogIsCut.value
    ? t('dialogs.audioEditor.saveHintEdited')
    : t('dialogs.audioEditor.saveHintPlain')
)
const audioData = ref<ArrayBuffer | null>(null)
const isAudioLoading = ref(false)
const audioLoadProgress = ref(0)

let ws: WaveSurfer | null = null

let regionsPlugin: any = null
let ffmpeg: FFmpeg | null = null
let ffmpegLoaded = false
let handleObserver: MutationObserver | null = null
let currentBlobUrl: string | null = null

function formatTimeHMS(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const formattedCurrentTime = computed(() => formatTimeHMS(currentTime.value))
const formattedDuration = computed(() => formatTimeHMS(duration.value))

function formatTimeMMSS(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

async function initFFmpeg() {
  if (ffmpegLoaded) return
  try {
    ffmpeg = new FFmpeg()
    ffmpeg.on('log', ({ message }) => {
      console.log('FFmpeg log:', message)
    })
    const baseURL = '/ffmpeg'
    await ffmpeg.load({
      coreURL: `${baseURL}/ffmpeg-core.js`,
      wasmURL: `${baseURL}/ffmpeg-core.wasm`,
      classWorkerURL: `${baseURL}/ffmpeg-core.worker.js`
    })
    ffmpegLoaded = true
  } catch (error) {
    console.error('FFmpeg 加载失败:', error)
  }
}

function applyHandleIcons() {
  if (!ws) return
  nextTick(() => {
    const wrapper = ws?.getWrapper?.()
    if (!wrapper) return
    const regions = wrapper.querySelectorAll('[part~="region"]')
    regions.forEach((regionEl) => {
      const region = regionEl as HTMLElement
      if (!region.querySelector('.audio-crop-modal-region-highlight-border-top')) {
        const topBorder = document.createElement('div')
        topBorder.className = 'audio-crop-modal-region-highlight-border audio-crop-modal-region-highlight-border-top'
        region.appendChild(topBorder)
      }
      if (!region.querySelector('.audio-crop-modal-region-highlight-border-bottom')) {
        const bottomBorder = document.createElement('div')
        bottomBorder.className = 'audio-crop-modal-region-highlight-border audio-crop-modal-region-highlight-border-bottom'
        region.appendChild(bottomBorder)
      }
    })

    const handles = wrapper.querySelectorAll('[part*="region-handle"]')
    handles.forEach((handleEl) => {
      const handle = handleEl as HTMLElement
      const part = handle.getAttribute('part') || ''
      handle.classList.add('audio-crop-modal-region-handle')
      if (part.includes('region-handle-left')) {
        handle.classList.add('audio-crop-modal-region-handle-left')
      }
      if (part.includes('region-handle-right')) {
        handle.classList.add('audio-crop-modal-region-handle-right')
      }
      const exist = handle.querySelector('.icon_editingpopup_crop_handle')
      if (exist) return
      const img = document.createElement('img')
      img.src = iconHandle
      img.className = 'icon_editingpopup_crop_handle'
      handle.appendChild(img)
    })
  })
}

function scheduleApplyHandleIcons() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      applyHandleIcons()
    })
  })
}

function setupHandleObserver() {
  if (!ws) return
  const wrapper = ws.getWrapper?.()
  if (!wrapper) return
  handleObserver?.disconnect()
  handleObserver = new MutationObserver(() => {
    applyHandleIcons()
  })
  handleObserver.observe(wrapper, { childList: true, subtree: true })
}


function getPointerTime(clientX: number) {
  if (!waveformRef.value || !duration.value || !ws) return 0
  const rect = waveformRef.value.getBoundingClientRect()
  const renderer = (ws as any).renderer
  const scrollContainer = renderer?.scrollContainer || waveformRef.value
  const scrollLeft = scrollContainer?.scrollLeft || 0
  const scrollWidth = scrollContainer?.scrollWidth || rect.width
  const x = Math.max(0, Math.min(clientX - rect.left + scrollLeft, scrollWidth))
  return (x / scrollWidth) * duration.value
}

function setRegion(start: number, end: number) {
  if (!regionsPlugin) return
  const safeStart = Math.max(0, Math.min(start, duration.value))
  const safeEnd = Math.max(safeStart + 0.1, Math.min(end, duration.value))
  regionsPlugin.clearRegions()
  const region = regionsPlugin.addRegion({
    start: safeStart,
    end: safeEnd,
    color: 'transparent',
    resize: true,
    drag: true,
  })
  hasSelection.value = true
  selectedRegion.value = region
  scheduleApplyHandleIcons()
}

function handleWaveformMouseMove(e: MouseEvent) {
  if (!waveformRef.value) return
  const rect = waveformRef.value.getBoundingClientRect()
  hoverLineX.value = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
  hoverLineTime.value = getPointerTime(e.clientX)
  hoverLineVisible.value = true
}

function handleWaveformMouseLeave() {
  hoverLineVisible.value = false
}

function handleWaveformClick(e: MouseEvent) {
  if (!ws || !regionsPlugin || !waveformRef.value) return

  const target = e.target as HTMLElement
  if (target.closest('[part*="region-handle"]') || target.closest('.wavesurfer-region')) return

  const clickPos = getPointerTime(e.clientX)
  const start = selectedRegion.value?.start ?? 0
  const end = Math.max(clickPos, start + 0.1)
  setRegion(start, end)
}

async function initWaveSurfer() {
  if (!waveformRef.value || !timelineRef.value) return

  regionsPlugin = RegionsPlugin.create()

  ws = WaveSurfer.create({
    container: waveformRef.value,
    waveColor: '#BFBFBF',
    progressColor: '#1577ff',
    cursorColor: 'transparent',
    height: 'auto',
    barWidth: 2,
    barGap: 1,
    barRadius: 2,
    interact: true,
    minPxPerSec: zoomLevel.value,
    plugins: [
      regionsPlugin,
      TimelinePlugin.create({
        container: timelineRef.value,
        timeInterval: 5,
        primaryLabelInterval: 5,
        style: {
          fontSize: '12px',
          color: '#8C8C8C'
        }
      })
    ]
  })


  ws.on('ready', () => {
    duration.value = ws?.getDuration() || 0
  })

  ws.on('audioprocess', () => {
    currentTime.value = ws?.getCurrentTime() || 0
    ;(ws as any).stopAtPosition = null
  })

  ws.on('seeking', () => {
    currentTime.value = ws?.getCurrentTime() || 0
  })

  ws.on('play', () => { isPlaying.value = true })
  ws.on('pause', () => { isPlaying.value = false })
  ws.on('scroll', () => {})

  const originalPlay = ws.play.bind(ws)
  ws.play = (start?: number, _end?: number) => originalPlay(start, undefined)

  regionsPlugin.on('region-created', (region: any) => {
    const regions = regionsPlugin.getRegions()
    regions.forEach((r: any) => {
      if (r.id !== region.id) r.remove()
    })
    region.play = () => {}
    region.on('click', () => {
      ;(ws as any).stopAtPosition = null
    })
    hasSelection.value = true
    selectedRegion.value = region
    scheduleApplyHandleIcons()
  })

  regionsPlugin.on('region-updated', (region: any) => {
    hasSelection.value = true
    selectedRegion.value = region
    scheduleApplyHandleIcons()
  })

  regionsPlugin.on('region-removed', () => {  
    if (!regionsPlugin.getRegions().length) {
      hasSelection.value = false
      selectedRegion.value = null
    }
  })

  ws.once('ready', () => {
    const defaultEnd = Math.min(8, duration.value || 8)
    setRegion(0, defaultEnd)
  })
}

async function loadAudio() {
  if (!ws || !props.audioUrl) return
  isAudioLoading.value = true
  audioLoadProgress.value = 0
  try {
    const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.responseType = 'arraybuffer'
      xhr.onprogress = (e) => {
        if (e.lengthComputable) {
          audioLoadProgress.value = Math.min(90, Math.round((e.loaded / e.total) * 90))
        }
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.response)
        } else {
          reject(new Error(`HTTP ${xhr.status}`))
        }
      }
      xhr.onerror = () => reject(new Error(t('dialogs.audioEditor.networkError')))
      xhr.open('GET', props.audioUrl)
      xhr.send()
    })
    audioData.value = arrayBuffer
    audioLoadProgress.value = 92
    if (currentBlobUrl) URL.revokeObjectURL(currentBlobUrl)
    currentBlobUrl = URL.createObjectURL(new Blob([arrayBuffer]))
    await ws.load(currentBlobUrl)
    audioLoadProgress.value = 100
  } catch (error) {
    console.error('音频加载失败:', error)
    ElMessage.error(t('dialogs.audioEditor.audioLoadFailed'))
  } finally {
    isAudioLoading.value = false
    audioLoadProgress.value = 0
  }
}

async function onDialogOpened() {
  await nextTick()
  await initFFmpeg()
  await initWaveSurfer()
  setupHandleObserver()
  await loadAudio()
  scheduleApplyHandleIcons()
}

function onDialogClose() {
  if (currentBlobUrl) {
    URL.revokeObjectURL(currentBlobUrl)
    currentBlobUrl = null
  }
  if (ws) {
    ws.destroy()
    ws = null
  }
  handleObserver?.disconnect()
  handleObserver = null
  regionsPlugin = null
  isPlaying.value = false
  currentTime.value = 0
  duration.value = 0
  hasSelection.value = false
  selectedRegion.value = null
  audioData.value = null
  zoomLevel.value = 50
  hoverLineVisible.value = false
}

function playPause() {
  if (!ws) return
  ;(ws as any).stopAtPosition = null
  ws.playPause()
}

function cutRegion() {
  handleCut()
}

function deleteRegion() {
  if (!hasSelection.value || !selectedRegion.value) return
  selectedRegion.value.remove()
  hasSelection.value = false
  selectedRegion.value = null
}

function closeDialog() {
  emit('update:visible', false)
}

function openSaveDialog(isCut: boolean) {
  if (isCut && (!hasSelection.value || !selectedRegion.value)) {
    ElMessage.warning(t('dialogs.audioEditor.selectRegionFirst'))
    return
  }
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  saveFileName.value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
  saveDialogIsCut.value = isCut
  saveDialogVisible.value = true
}

function handleSaveAs() {
  openSaveDialog(false)
}

function handleCut() {
  openSaveDialog(true)
}

async function confirmSave() {
  if (!audioData.value) return
  const isCut = saveDialogIsCut.value
  if (isCut && !selectedRegion.value) return
  if (isCut && (!ffmpegLoaded || !ffmpeg)) {
    ElMessage.error(t('dialogs.audioEditor.ffmpegNotReady'))
    return
  }

  saveDialogVisible.value = false
  processing.value = true

  try {
    const ext = getFileExtension(props.fileName)
    const mimeType = ext === 'mp3' ? 'audio/mpeg' : ext === 'wav' ? 'audio/wav' : 'audio/ogg'
    const uploadFileName = `${saveFileName.value}.${ext}`
    let blob: Blob
    let uploadDuration: number

    if (isCut) {
      processingMessage.value = t('dialogs.audioEditor.processingCut')
      const startTime = selectedRegion.value!.start
      const endTime = selectedRegion.value!.end
      const clipDuration = endTime - startTime
      uploadDuration = Math.round(clipDuration)

      const inputFileName = `input.${ext}`
      const outputFileName = `output.${ext}`

      await ffmpeg!.writeFile(inputFileName, new Uint8Array(audioData.value))

      try {
        await ffmpeg!.exec([
          '-i', inputFileName,
          '-ss', String(startTime),
          '-t', String(clipDuration),
          '-c', 'copy',
          '-y',
          outputFileName
        ])
      } catch {
        await ffmpeg!.exec([
          '-i', inputFileName,
          '-ss', String(startTime),
          '-t', String(clipDuration),
          '-y',
          outputFileName
        ])
      }

      const outputData = await ffmpeg!.readFile(outputFileName)
      blob = new Blob([outputData], { type: mimeType })

      try {
        await ffmpeg!.deleteFile(inputFileName)
        await ffmpeg!.deleteFile(outputFileName)
      } catch {}
    } else {
      processingMessage.value = t('dialogs.audioEditor.preparing')
      uploadDuration = Math.round(duration.value)
      blob = new Blob([audioData.value], { type: mimeType })
    }

    const file = new File([blob], uploadFileName, { type: mimeType })

    const userId = loginStore.loginData?.userId ?? ''
    if (!userId) {
      ElMessage.error(t('dialogs.audioEditor.loginFirst'))
      return
    }

    processingMessage.value = t('dialogs.audioEditor.uploadCredential')
    const stsRes = await getStsToken({
      fileSize: String(file.size),
      userId,
      fileName: uploadFileName,
      uploadMethod: '3',
      folderId: '0',
      action: '1',
      duration: String(uploadDuration)
    })
    const stsPayload = (stsRes as any)?.data?.data ?? (stsRes as any)?.data
    if (!stsPayload) {
      throw new Error('获取上传凭证失败')
    }

    const ossData = stsPayload?.data?.host ? stsPayload.data : stsPayload?.data ?? stsPayload
    if (!ossData?.host || !ossData?.callbackVar) {
      throw new Error('上传凭证格式异常')
    }
    const fileUuid = String(ossData?.fileUuid ?? '').trim()
    if (!fileUuid) throw new Error('上传凭证缺少 fileUuid')
    
    const dir = String(ossData.dir ?? '')
    const key = dir.endsWith(uploadFileName) ? dir : `${dir}${uploadFileName}`
    const formData = new FormData()
    formData.append('key', key)
    formData.append('policy', String(ossData.policy ?? ''))
    formData.append('x-oss-signature', String(ossData.signature ?? ''))
    formData.append('x-oss-signature-version', String(ossData.version ?? ''))
    formData.append('x-oss-credential', String(ossData.x_oss_credential ?? ''))
    formData.append('x-oss-date', String(ossData.x_oss_date ?? ''))
    formData.append('x-oss-security-token', String(ossData.security_token ?? ossData.x_oss_security_token ?? ''))
    formData.append('success_action_status', '200')
    if (ossData.callback) formData.append('callback', String(ossData.callback))
    const callbackVar = JSON.parse(String(ossData.callbackVar))
    callbackVar['x:uuid'] = fileUuid
    callbackVar['x:duration'] = callbackVar['x:duration'] ?? String(uploadDuration)
    Object.keys(callbackVar).forEach((k) => formData.append(k, String(callbackVar[k])))
    formData.append('file', file, uploadFileName)
    
    processingMessage.value = t('dialogs.audioEditor.uploading')
    const result = await new Promise<any>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.addEventListener('load', () => {
        const text = String(xhr.responseText ?? '')
        if (xhr.status >= 200 && xhr.status < 300 && xhr.status !== 203) {
          try {
            const parsed = text.trim() ? JSON.parse(text) : {}
            if (parsed?.code !== undefined && parsed?.code !== null && parsed.code !== 200 && parsed.code !== '200') {
              reject(new Error(parsed.msg || parsed.message || t('dialogs.audioEditor.uploadFailed')))
              return
            }
            resolve({ fileUuid, key, uploadFileName, ...parsed })
          } catch {
            resolve({ fileUuid, key, uploadFileName })
          }
          return
        }
        reject(new Error(text || `上传失败: HTTP ${xhr.status}`))
      })
      xhr.addEventListener('error', () => reject(new Error(t('dialogs.audioEditor.networkError'))))
      xhr.open('POST', String(ossData.host))
      xhr.send(formData)
    })
    ElMessage.success(t('dialogs.audioEditor.uploadSuccess'))
    emit('save', blob, saveFileName.value, result)
  } catch (error) {
    console.error('音频处理失败:', error)
    ElMessage.error(t('dialogs.audioEditor.processFailed', { msg: (error as Error).message }))
  } finally {
    processing.value = false
  }
}

function getFileExtension(name: string): string {
  const match = name.match(/\.(\w+)$/)
  return match ? match[1].toLowerCase() : 'mp3'
}

function handleZoomChange(e: Event) {
  const val = Number((e.target as HTMLInputElement).value)
  zoomLevel.value = val
  if (ws) ws.zoom(val)
}

function zoomIn() {
  zoomLevel.value = Math.min(ZOOM_MAX_PCT, zoomLevel.value + 30)
  if (ws) ws.zoom(zoomLevel.value)
}

function zoomOut() {
  zoomLevel.value = Math.max(ZOOM_MIN_PCT, zoomLevel.value - 30)
  if (ws) ws.zoom(zoomLevel.value)
}
</script>

<style lang="scss" scoped>
.audio-editor-body {
  position: relative;
}

.editor-container {
  display: flex;
  flex-direction: column;
  height: 70vh;
  background: #fff;
}

.editor-header {
  display: flex;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;

  .file-name {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    max-width: 400px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tool-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-left: auto;
    margin-right: auto;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }
}

.editor-tool-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 10px;
  background: #f0f2f5;
  cursor: pointer;
  transition: background 0.2s;

  img {
    width: 20px;
    height: 20px;
  }

  &:hover {
    background: #e8eaed;
  }

  &:active {
    background: #dcdfe3;
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;

    &:hover {
      background: #f0f2f5;
    }
  }
}

.waveform-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 24px;
  overflow: hidden;
  background: #f5f8fc;

  .timeline-container {
    flex-shrink: 0;
    height: 28px;
  }

  .waveform-container {
    flex: 1;
    min-height: 0;
    position: relative;
    overflow-x: auto;
    overflow-y: hidden;

    > :not(.hover-line) {
      position: relative;
      z-index: 1;
    }

    .hover-line {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 2px;
      background: #1a9cff;
      z-index: 6;
      pointer-events: none;

      .hover-time {
        position: absolute;
        top: -22px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 12px;
        font-weight: 600;
        color: #1a9cff;
        background: #fff;
        padding: 0 4px;
        border-radius: 2px;
        white-space: nowrap;

        &::after {
          content: '';
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          top: calc(100% + 2px);
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 7px solid #1a9cff;
        }
      }
    }
  }
}

.editor-footer {
  display: flex;
  align-items: center;
  padding: 20px 24px;
  min-height: 72px;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
  position: relative;
  box-sizing: border-box;

  .time-display {
    font-size: 14px;
    color: #333;
    font-family: monospace;
    min-width: 140px;
  }

  .play-btn {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: 50%;
    background-color: rgba(64, 158, 255, 0.1);
    transition: background 0.2s;

    .play-btn-icon {
      width: 24px;
      height: 24px;
      display: block;
      object-fit: contain;
    }

    &:hover {
      background-color: rgba(64, 158, 255, 0.2);
    }
  }

  .zoom-controls {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .zoom-icon {
    width: 20px;
    height: 20px;
    cursor: pointer;
    flex-shrink: 0;
    opacity: 0.7;
    transition: opacity 0.2s;

    &:hover {
      opacity: 1;
    }
  }

  .zoom-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 120px;
    height: 4px;
    border-radius: 2px;
    background: #e0e0e0;
    outline: none;
    cursor: pointer;

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #409eff;
      border: 2px solid #fff;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      cursor: pointer;
    }

    &::-moz-range-thumb {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #409eff;
      border: 2px solid #fff;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      cursor: pointer;
    }
  }
}

.audio-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.85);
  z-index: 1999;
  pointer-events: none;
}

.audio-loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.audio-loading-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.audio-loading-text {
  font-size: 14px;
  color: #333;
}

.audio-loading-icon {
  font-size: 20px;
  color: #1577ff;
}

.audio-loading-hint {
  margin: 0;
  font-size: 12px;
  color: #999;
}

.processing-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  padding-top: 16px;
  z-index: 2000;
  pointer-events: none;

  .processing-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #409eff;
    color: #fff;
    padding: 10px 24px;
    border-radius: 20px;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
  }

  .processing-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.save-hint {
  font-size: 13px;
  color: #666;
  margin-bottom: 16px;
  line-height: 1.6;
}

.save-field {
  label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: #333;
    margin-bottom: 8px;
  }
}
</style>

<style lang="scss">
.audio-editor-dialog {
  .el-dialog {
    border-radius: 16px;
    overflow: hidden;
  }

  .el-dialog__header {
    display: none;
  }

  .el-dialog__body {
    padding: 0 !important;
  }
}

.save-as-dialog {
  .el-dialog {
    border-radius: 16px;
  }
}

.audio-editor-dialog .waveform-container ::part(region) {
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  border-radius: 0 !important;
  background: transparent !important;
  background-clip: content-box !important;
  padding-left: 30px !important;
  padding-right: 30px !important;
  overflow: hidden !important;
  box-sizing: border-box !important;
}

.audio-editor-dialog .waveform-container ::part(region-handle-left),
.audio-editor-dialog .waveform-container ::part(region-handle-right) {
  width: 30px !important;
  min-width: 30px !important;
  max-width: 30px !important;
  background-color: #1577ff !important;
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  border-radius: 17px 0 0 17px !important;
  z-index: 2000 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: ew-resize !important;
  pointer-events: auto !important;
  transition: background-color .2s !important;
  isolation: isolate !important;
  overflow: hidden !important;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 24.5'%3E%3Crect width='8' height='24.5' fill='%230075FF'/%3E%3Cpath d='M1 0L1 24.5M7 0L7 24.5' stroke='white' stroke-width='2' stroke-opacity='1' fill='none'/%3E%3C/svg%3E") !important;
  background-repeat: no-repeat !important;
  background-position: center !important;
  background-size: 10px 26px !important;
  z-index: 9999 !important;
}

.audio-editor-dialog .waveform-container ::part(region-handle-left) {
  left: 0 !important;
  border-radius: 17px 0 0 17px !important;
}

.audio-editor-dialog .waveform-container ::part(region-handle-right) {
  right: 0 !important;
  margin-right: 0 !important;
  transform: none !important;
  border-radius: 0 17px 17px 0 !important;
}

.audio-crop-modal-region-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 30px;
  background-color: var(--color-primary, #0075FF);
  cursor: ew-resize;
  pointer-events: auto;
  z-index: 100;
  transition: background-color .2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.audio-crop-modal-region-handle .icon_editingpopup_crop_handle {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 30px;
  height: 30px;
  display: block;
  pointer-events: none;
  object-fit: contain;
  z-index: 1;
  overflow-clip-margin: content-box;
  overflow: clip;
}

.audio-crop-modal-region-handle-left {
  left: 0;
  border-radius: 17px 0 0 17px;
}

.audio-crop-modal-region-handle-right {
  right: 0;
  margin-right: 0;
  border-radius: 0 17px 17px 0;
}

.audio-crop-modal-region-highlight-border {
  position: absolute;
  left: 30px;
  right: 30px;
  height: 1px;
  background-color: var(--color-primary, #0075FF);
  pointer-events: none;
  z-index: 1000;
}

.audio-crop-modal-region-highlight-border-top {
  top: 0;
}

.audio-crop-modal-region-highlight-border-bottom {
  bottom: 0;
}
</style>
