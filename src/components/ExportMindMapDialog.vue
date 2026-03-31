<template>
  <el-dialog
    v-model="isDialogVisible"
    :title="t('dialogs.exportMindMap.title')"
    width="400px"
    :show-close="true"
    class="export-mindmap-dialog"
    @close="closeDialog"
  >
    <div class="export-format-label">{{ t('dialogs.exportMindMap.exportAs') }}</div>
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
        {{ t('dialogs.exportMindMap.export') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Check } from '@element-plus/icons-vue'
import { Transformer } from 'markmap-lib'
import { Markmap } from 'markmap-view'
import html2canvas from 'html2canvas'
import iconMarkdown from '@/assets/allfiles/icon_export_markdown.svg'
import iconJpeg from '@/assets/allfiles/icon_export_jpeg.svg'

const props = defineProps<{
  visible: boolean
  markdown: string
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
  { value: 'md' as const, label: 'Markdown', icon: iconMarkdown },
  { value: 'jpeg' as const, label: 'JPEG', icon: iconJpeg }
]

const selectedFormat = ref<'md' | 'jpeg'>('md')
const isExporting = ref(false)

watch(() => props.visible, (val) => {
  if (val) {
    selectedFormat.value = 'md'
  }
})

function getExtension() {
  const map = { md: '.md', jpeg: '.jpeg' }
  return map[selectedFormat.value]
}

async function generateMarkdownBlob(): Promise<Blob> {
  return new Blob([props.markdown || ''], { type: 'text/plain;charset=utf-8' })
}

async function generateJpegBlob(): Promise<Blob> {
  const markdown = props.markdown
  if (!markdown) throw new Error('No content')

  const container = document.createElement('div')
  container.style.cssText = `
    position: fixed;
    top: ${window.innerHeight}px;
    left: 0;
    width: 1200px;
    height: 800px;
    background: #fff;
    overflow: hidden;
  `
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.style.cssText = 'width: 100%; height: 100%; display: block;'
  container.appendChild(svg)
  document.body.appendChild(container)

  try {
    const transformer = new Transformer()
    const { root } = transformer.transform(markdown)
    const mm = Markmap.create(svg, { autoFit: true, duration: 0 }, root)
    mm.fit()

    await new Promise((r) => setTimeout(r, 500))

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff'
    })

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Failed to create blob'))
        },
        'image/jpeg',
        0.95
      )
    })
  } finally {
    document.body.removeChild(container)
  }
}

async function generateBlob(): Promise<Blob> {
  if (selectedFormat.value === 'md') {
    return generateMarkdownBlob()
  }
  if (selectedFormat.value === 'jpeg') {
    return generateJpegBlob()
  }
  throw new Error('Unsupported format')
}

async function handleExport() {
  if (!props.markdown) {
    ElMessage.warning(t('dialogs.exportMindMap.noContent'))
    return
  }

  ElMessage.info(t('dialogs.exportMindMap.exporting'))
  isExporting.value = true
  try {
    const blob = await generateBlob()
    isDialogVisible.value = false
    const ext = getExtension()
    const filename = `${props.fileName?.replace(/\.[^.]+$/, '') || t('dialogs.exportMindMap.defaultFileName')}${ext}`

    if ('showSaveFilePicker' in window) {
      try {
        const accept: Record<string, Record<string, string[]>> = {
          md: { 'text/plain': ['.md'] },
          jpeg: { 'image/jpeg': ['.jpeg', '.jpg'] }
        }
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [{ description: t('dialogs.exportMindMap.filePickerDesc'), accept: accept[selectedFormat.value] }]
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

    ElMessage.success(t('dialogs.exportMindMap.exportDone'))
  } catch (e) {
    console.error('Export mind map failed:', e)
    ElMessage.error(t('dialogs.exportMindMap.exportFailed'))
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
