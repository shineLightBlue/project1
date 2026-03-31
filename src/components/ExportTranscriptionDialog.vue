<template>
  <el-dialog
    v-model="isDialogVisible"
    :title="t('dialogs.exportTranscription.title')"
    width="400px"
    :show-close="true"
    class="export-transcription-dialog"
    @close="closeDialog"
  >
    <div class="export-format-label">{{ t('dialogs.exportTranscription.exportAs') }}</div>
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
    <div class="export-include-label">{{ t('dialogs.exportTranscription.include') }}</div>
    <div class="include-options">
      <div
        class="include-option-item"
        :class="{ selected: includeTimestamp }"
        @click="includeTimestamp = !includeTimestamp"
      >
        <span class="include-label">{{ t('dialogs.exportTranscription.timestamp') }}</span>
        <el-checkbox v-model="includeTimestamp" @click.prevent />
      </div>
      <div
        class="include-option-item"
        :class="{ selected: includeSpeaker }"
        @click="includeSpeaker = !includeSpeaker"
      >
        <span class="include-label">{{ t('dialogs.exportTranscription.speaker') }}</span>
        <el-checkbox v-model="includeSpeaker" @click.prevent />
      </div>
    </div>
    <template #footer>
      <el-button type="primary" class="export-btn" :loading="isExporting" @click="handleExport">
        {{ t('dialogs.exportTranscription.export') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElIcon } from 'element-plus'
import { Check } from '@element-plus/icons-vue'
import { Document, Paragraph, TextRun, Packer } from 'docx'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import iconTxt from '@/assets/allfiles/icon_export_txt.svg'
import iconSrt from '@/assets/allfiles/icon_export_srt.svg'
import iconDocx from '@/assets/allfiles/icon_export_docx.svg'
import iconPdf from '@/assets/allfiles/icon_export_pdf.svg'

interface SentenceInfo {
  speaker?: string
  text?: string
  start?: string
  end?: string
  startMs?: number
  endMs?: number
}

const props = defineProps<{
  visible: boolean
  sentenceInfos: SentenceInfo[]
  fileName?: string
  title?: string
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
  { value: 'txt' as const, label: 'TXT', icon: iconTxt },
  { value: 'srt' as const, label: 'SRT', icon: iconSrt },
  { value: 'docx' as const, label: 'DOCX', icon: iconDocx },
  { value: 'pdf' as const, label: 'PDF', icon: iconPdf }
]

const selectedFormat = ref<'txt' | 'srt' | 'docx' | 'pdf'>('txt')
const includeTimestamp = ref(true)
const includeSpeaker = ref(true)
const isExporting = ref(false)

watch(() => props.visible, (val) => {
  if (val) {
    selectedFormat.value = 'txt'
    includeTimestamp.value = true
    includeSpeaker.value = true
  }
})

function buildLines() {
  const list = props.sentenceInfos || []
  const contentLines = list.map((s) => {
    const parts: string[] = []
    if (includeTimestamp.value && s.start && s.end) {
      parts.push(`[${s.start}-${s.end}]`)
    }
    if (includeSpeaker.value) {
      parts.push(t('dialogs.exportTranscription.speakerLine', { id: s.speaker ?? '0' }))
    }
    const prefix = parts.length ? parts.join(' ') + ': ' : ''
    return prefix + (s.text ?? '')
  })
  const title = props.title?.trim()
  return title ? [title, '', ...contentLines] : contentLines
}

function msToSrtTime(ms: number) {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  const mm = ms % 1000
  const pad = (n: number) => String(n).padStart(2, '0')
  const pad3 = (n: number) => String(n).padStart(3, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad3(mm)}`
}

function buildSrtContent() {
  const list = props.sentenceInfos || []
  const blocks: string[] = []
  const title = props.title?.trim()
  if (title) {
    blocks.push(title)
    blocks.push('')
  }
  list.forEach((s, i) => {
    const startMs = s.startMs ?? 0
    const endMs = s.endMs ?? startMs + 3000
    blocks.push(String(i + 1))
    blocks.push(`${msToSrtTime(startMs)} --> ${msToSrtTime(endMs)}`)
    const parts: string[] = []
    if (includeSpeaker.value) {
      parts.push(t('dialogs.exportTranscription.speakerLine', { id: s.speaker ?? '0' }))
    }
    parts.push(s.text ?? '')
    blocks.push(parts.join(': '))
    blocks.push('')
  })
  return blocks.join('\n')
}

function getExtension() {
  const map = { txt: '.txt', srt: '.srt', docx: '.docx', pdf: '.pdf' }
  return map[selectedFormat.value]
}

function getMimeType() {
  const map = {
    txt: 'text/plain;charset=utf-8',
    srt: 'text/plain;charset=utf-8',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    pdf: 'application/pdf'
  }
  return map[selectedFormat.value]
}

async function generateBlob(): Promise<Blob> {
  const baseName = props.fileName?.replace(/\.[^.]+$/, '') || t('dialogs.exportTranscription.defaultFileName')

  if (selectedFormat.value === 'txt') {
    const text = buildLines().join('\n')
    return new Blob([text], { type: 'text/plain;charset=utf-8' })
  }

  if (selectedFormat.value === 'srt') {
    const text = buildSrtContent()
    return new Blob([text], { type: 'text/plain;charset=utf-8' })
  }

  if (selectedFormat.value === 'docx') {
    const lines = buildLines()
    const paragraphs = lines.map((line, i) =>
      new Paragraph({
        children: [
          new TextRun({
            text: line,
            bold: i === 0 && props.title?.trim(),
            size: i === 0 && props.title?.trim() ? 32 : 24
          })
        ]
      })
    )
    const doc = new Document({
      sections: [{ children: paragraphs }]
    })
    const buffer = await Packer.toBlob(doc)
    return buffer
  }

  if (selectedFormat.value === 'pdf') {
    const lines = buildLines()
    const escapedLines = lines.map((l) =>
      String(l)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
    )
    const div = document.createElement('div')
    div.style.cssText = `
      position: fixed;
      top: ${window.innerHeight}px;
      left: 0;
      width: 170mm;
      max-width: 100vw;
      padding: 10px;
      background: #fff;
      font-family: "Microsoft YaHei", "PingFang SC", "SimSun", "Noto Sans SC", "Hiragino Sans GB", sans-serif;
      font-size: 12px;
      line-height: 1.6;
      color: #333;
      white-space: pre-wrap;
      overflow-wrap: break-word;
      word-break: normal;
      box-sizing: border-box;
    `
    div.innerHTML = escapedLines
      .map((l, i) => {
        const isTitle = i === 0 && props.title?.trim()
        return `<div style="margin-bottom: 6px; ${isTitle ? 'font-size: 16px; font-weight: bold;' : ''}">${l}</div>`
      })
      .join('')
    document.body.appendChild(div)

    div.style.height = 'auto'
    const scrollHeight = div.scrollHeight

    await new Promise((r) => requestAnimationFrame(r))

    const canvas = await html2canvas(div, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
      windowHeight: scrollHeight
    })

    document.body.removeChild(div)

    const pdf = new jsPDF('p', 'mm', 'a4')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const margin = 10
    const imgWidth = pdfWidth - margin * 2
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    let position = margin
    let heightLeft = imgHeight

    pdf.addImage(canvas, 'PNG', margin, position, imgWidth, imgHeight, undefined, 'FAST')

    while (heightLeft > pdfHeight - margin * 2) {
      position -= pdfHeight - margin * 2
      pdf.addPage()
      pdf.addImage(canvas, 'PNG', margin, position, imgWidth, imgHeight, undefined, 'FAST')
      heightLeft -= pdfHeight - margin * 2
    }

    return pdf.output('blob')
  }

  throw new Error('Unsupported format')
}

async function handleExport() {
  if (!props.sentenceInfos?.length) {
    ElMessage.warning(t('dialogs.exportTranscription.noContent'))
    return
  }

  ElMessage.info(t('dialogs.exportTranscription.exporting'))
  isExporting.value = true
  try {
    const blob = await generateBlob()
    isDialogVisible.value = false
    const ext = getExtension()
    const filename = `${props.fileName?.replace(/\.[^.]+$/, '') || t('dialogs.exportTranscription.defaultFileName')}${ext}`

    if ('showSaveFilePicker' in window) {
      try {
        const accept: Record<string, string[]> = {
          txt: { 'text/plain': ['.txt'] },
          srt: { 'text/plain': ['.srt'] },
          docx: { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
          pdf: { 'application/pdf': ['.pdf'] }
        }
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [{ description: t('dialogs.exportTranscription.filePickerDesc'), accept: accept[selectedFormat.value] }]
        })
        const writable = await handle.createWritable()
        await writable.write(blob)
        await writable.close()
      } catch (err: any) {
        if (err?.name === 'AbortError') return
        throw err
      }
    } else {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }

    ElMessage.success(t('dialogs.exportTranscription.exportDone'))
  } catch (e) {
    console.error('Export transcription failed:', e)
    ElMessage.error(t('dialogs.exportTranscription.exportFailed'))
  } finally {
    isExporting.value = false
  }
}

function closeDialog() {
  emit('update:visible', false)
}
</script>

<style scoped lang="scss">
.export-format-label,
.export-include-label {
  font-size: 14px;
  color: #333;
  margin-bottom: 12px;
}

.export-include-label {
  margin-top: 20px;
}

.format-options,
.include-options {
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
  background-color: #ecebeb99;
  border: 1px solid transparent;

  &.selected {
    background-color: #DDEBFE;
    border-color: #409eff;
  }

  &:hover {
    background-color: #e5e5e5;
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

.include-option-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  background-color: #ecebeb99;
  border: 1px solid transparent;

  &.selected {
    background-color: #DDEBFE;
    border-color: #409eff;
  }

  &:hover {
    background-color: #e5e5e5;
  }

  .include-label {
    font-size: 14px;
    color: #333;
  }
}

.export-btn {
  width: 100%;
}
</style>
