<template>
  <div ref="containerRef" class="blocknote-editor">
    <BlockNoteView
      ref="blockNoteViewRef"
      :editor-props="editorProps"
      theme="light"
      @change="handleChange"
    />
  </div>
</template>

<script setup lang="ts">
import { BlockNoteView } from 'blocknote-vue'
// import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const containerRef = ref<HTMLElement | null>(null)
const blockNoteViewRef = ref<any>(null)
const isInternalUpdate = ref(false)

const editorProps = ref<{ initialContent?: any[] }>({})

function getEditor() {
  const exposed = blockNoteViewRef.value
  if (!exposed?.editor) return null
  return exposed.editor?.value ?? exposed.editor
}

// 暴露 getEditor 方法给父组件
defineExpose({
  getEditor,
})

async function loadMarkdown(markdown: string) {
  const editor = getEditor()
  if (!editor || !markdown) return

  try {
    isInternalUpdate.value = true
    const blocks = await editor.tryParseMarkdownToBlocks(markdown)
    editor.replaceBlocks(editor.document, blocks)
  } catch (e) {
    console.error('BlockNote markdown parse error:', e)
  } finally {
    isInternalUpdate.value = false
  }
}

function handleChange(_document: any, _changes: any, markdown: string) {
  if (!isInternalUpdate.value) {
    emit('update:modelValue', markdown)
  }
}

watch(
  () => getEditor(),
  async (editor) => {
    if (editor && props.modelValue) {
      await loadMarkdown(props.modelValue)
    }
  },
  { immediate: true, flush: 'post' }
)

watch(
  () => props.modelValue,
  async (newVal) => {
    const editor = getEditor()
    if (editor && newVal) {
      const currentMd = editor.blocksToMarkdownLossy?.() ?? ''
      if (newVal !== currentMd) {
        await loadMarkdown(newVal)
      }
    }
  }
)

onMounted(() => {
  nextTick(() => {
    setTimeout(() => {
      const editor = getEditor()
      if (editor && props.modelValue) {
        loadMarkdown(props.modelValue)
      }
    }, 100)
  })
})
</script>

<style scoped>
.blocknote-editor {
  width: 100%;
  min-height: 300px;
}

.blocknote-editor :deep(.note-view-container) {
  min-height: 300px;
}

/* 工具栏样式优化 - 圆角、阴影、间距，接近图2效果 */
.blocknote-editor :deep(.bn-toolbar) {
  border-radius: 8px !important;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12) !important;
  padding: 6px 8px !important;
  gap: 4px !important;
  background: #f5f5f5 !important;
  border: 1px solid #e8e8e8 !important;
  flex-wrap: nowrap !important;
  white-space: nowrap !important;
  min-width: max-content !important;
}

.blocknote-editor :deep(.bn-toolbar button),
.blocknote-editor :deep(.bn-toolbar [role="button"]) {
  border-radius: 6px !important;
  padding: 6px 8px !important;
  transition: background-color 0.2s, color 0.2s !important;
}

.blocknote-editor :deep(.bn-toolbar button:hover),
.blocknote-editor :deep(.bn-toolbar [role="button"]:hover) {
  background-color: #e8e8e8 !important;
}

.blocknote-editor :deep(.bn-toolbar button[data-selected="true"]),
.blocknote-editor :deep(.bn-toolbar [role="button"][data-selected="true"]) {
  background-color: #409eff !important;
  color: #fff !important;
}

/* 防止工具栏换行，避免 B 加粗等按钮跳到下一行 */
.blocknote-editor :deep(.bn-toolbar),
.blocknote-editor :deep(.bn-toolbar > div),
.blocknote-editor :deep(.bn-toolbar [class*="flex"]) {
  flex-wrap: nowrap !important;
}
</style>
