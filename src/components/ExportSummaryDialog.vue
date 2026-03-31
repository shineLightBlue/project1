<template>
  <el-dialog
    v-model="isDialogVisible"
    :title="t('dialogs.exportSummary.title')"
    width="400px"
    :show-close="true"
    class="export-summary-dialog"
    @close="closeDialog"
  >
    <div class="export-format-label">{{ t('dialogs.exportSummary.exportAs') }}</div>
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
        {{ t('dialogs.exportSummary.export') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Check } from '@element-plus/icons-vue'
import { Document, Paragraph, TextRun, Packer } from 'docx'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import iconTxt from '@/assets/allfiles/icon_export_txt.svg'
import iconMarkdown from '@/assets/allfiles/icon_export_markdown.svg'
import iconDocx from '@/assets/allfiles/icon_export_docx.svg'
import iconPdf from '@/assets/allfiles/icon_export_pdf.svg'

const props = defineProps<{
  visible: boolean
  content: string
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
  { value: 'txt' as const, label: 'TXT', icon: iconTxt },
  { value: 'md' as const, label: 'Markdown', icon: iconMarkdown },
  { value: 'docx' as const, label: 'DOCX', icon: iconDocx },
  { value: 'pdf' as const, label: 'PDF', icon: iconPdf }
]

const selectedFormat = ref<'txt' | 'md' | 'docx' | 'pdf'>('txt')
const isExporting = ref(false)

watch(() => props.visible, (val) => {
  if (val) {
    selectedFormat.value = 'txt'
  }
})

function getContent() {
  return props.content || ''
}

function getExtension() {
  const map = { txt: '.txt', md: '.md', docx: '.docx', pdf: '.pdf' }
  return map[selectedFormat.value]
}

async function generateBlob(): Promise<Blob> {
  const content = getContent()

  if (selectedFormat.value === 'txt') {
    return new Blob([content], { type: 'text/plain;charset=utf-8' })
  }

  if (selectedFormat.value === 'md') {
    return new Blob([content], { type: 'text/plain;charset=utf-8' })
  }

  if (selectedFormat.value === 'docx') {
    const lines = content.split(/\r?\n/)
    const paragraphs = lines.map((line, i) => {
      const isHeading = /^#{1,6}\s/.test(line)
      const text = line.replace(/^#{1,6}\s*/, '')
      return new Paragraph({
        children: [
          new TextRun({
            text: text || '\n',
            bold: isHeading,
            size: isHeading ? 32 : 24
          })
        ]
      })
    })
    const doc = new Document({
      sections: [{ children: paragraphs }]
    })
    const buffer = await Packer.toBlob(doc)
    return buffer
  }

  if (selectedFormat.value === 'pdf') {
    const lines = content.split(/\r?\n/)
    const escape = (s: string) =>
      String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
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
    div.innerHTML = lines
      .map((l) => {
        const isHeading = /^#{1,6}\s/.test(l)
        const text = isHeading ? l.replace(/^#{1,6}\s*/, '') : l
        return `<div style="margin-bottom: 6px; ${isHeading ? 'font-size: 16px; font-weight: bold;' : ''}">${escape(text)}</div>`
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
  if (!getContent()) {
    ElMessage.warning(t('dialogs.exportSummary.noContent'))
    return
  }

  ElMessage.info(t('dialogs.exportSummary.exporting'))
  isExporting.value = true
  try {
    const blob = await generateBlob()
    isDialogVisible.value = false
    const ext = getExtension()
    const filename = `${props.fileName?.replace(/\.[^.]+$/, '') || t('dialogs.exportSummary.defaultFileName')}${ext}`

    if ('showSaveFilePicker' in window) {
      try {
        const accept: Record<string, Record<string, string[]>> = {
          txt: { 'text/plain': ['.txt'] },
          md: { 'text/plain': ['.md'] },
          docx: {
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
          },
          pdf: { 'application/pdf': ['.pdf'] }
        }
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [{ description: t('dialogs.exportSummary.filePickerDesc'), accept: accept[selectedFormat.value] }]
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

    ElMessage.success(t('dialogs.exportSummary.exportDone'))
  } catch (e) {
    console.error('Export summary failed:', e)
    ElMessage.error(t('dialogs.exportSummary.exportFailed'))
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

.export-btn {
  width: 100%;
}
</style>
