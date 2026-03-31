<template>
  <div class="markdown-viewer markdown-ai">
    <BlockNoteView
      ref="blockNoteViewRef"
      :editor-props="editorProps"
      theme="light"
      :editable="false"
    />
  </div>
</template>

<script setup lang="ts">
import { BlockNoteView } from 'blocknote-vue'
// import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'

const props = defineProps<{
  content: string
}>()

const blockNoteViewRef = ref<any>(null)

const editorProps = ref({
  editable: false,
  // 禁用快捷键
  disableInputRules: true,
  disablePasteRules: true,
  // 禁用拖拽
  dragHandle: false,
  // 禁用链接编辑
  linkToolbar: false,
  // 禁用格式化工具栏
  formattingToolbar: false,
  // 禁用侧边菜单
  sideMenu: false,
  // 禁用斜杠命令菜单
  slashMenu: false,
})

function getEditor() {
  const exposed = blockNoteViewRef.value
  if (!exposed?.editor) return null
  return exposed.editor?.value ?? exposed.editor
}

async function loadMarkdown(markdown: string) {
  const editor = getEditor()
  if (!editor || !markdown) return

  try {
    const blocks = await editor.tryParseMarkdownToBlocks(markdown)
    editor.replaceBlocks(editor.document, blocks)
  } catch (e) {
    console.error('Markdown parse error:', e)
  }
}

watch(
  () => props.content,
  (newContent) => {
    if (newContent) {
      loadMarkdown(newContent)
    }
  },
  { immediate: true },
)

// 在编辑器加载后完全禁用交互功能
onMounted(() => {
  nextTick(() => {
    setTimeout(() => {
      const editor = getEditor()
      if (editor) {
        try {
          // 尝试禁用编辑器的交互功能
          if (editor.setEditable) {
            editor.setEditable(false)
          }
          if (editor.setReadOnly) {
            editor.setReadOnly(true)
          }
        } catch (e) {
          console.error('禁用编辑器交互功能失败:', e)
        }
      }
    }, 100)
  })
})
</script>

<style scoped>
.markdown-viewer {
  width: 100%;
  /* 移除最小高度限制，根据内容自适应 */
}

.markdown-viewer :deep(.note-view-container) {
  /* 移除固定高度，让内容自适应 */
  min-height: auto;
}

/* ===== 完全禁用编辑功能 ===== */

/* 隐藏工具栏（只读模式） */
.markdown-viewer :deep(.bn-toolbar) {
  display: none !important;
}

/* 禁用编辑功能：隐藏拖动手柄、光标等 */
.markdown-viewer :deep(.bn-drag-handle) {
  display: none !important;
}

.markdown-viewer :deep(.bn-drag-handle-grip) {
  display: none !important;
}

.markdown-viewer :deep(.bn-block-group:hover .bn-drag-handle) {
  display: none !important;
}

/* 禁用块级操作菜单 */
.markdown-viewer :deep(.bn-block-group-content .bn-block-content[contenteditable='true']) {
  pointer-events: none !important;
}

/* 禁用拖拽功能 */
.markdown-viewer :deep(.ProseMirror) {
  user-select: text !important;
  pointer-events: auto !important;
}

.markdown-viewer :deep(.ProseMirror) .ProseMirror-selectednode {
  outline: none !important;
}

/* 禁用选择光标 */
.markdownviewer :deep(.ProseMirror) .ProseMirror-cursor {
  display: none !important;
}

/* 禁用拖拽手柄 */
.markdown-viewer :deep(.ProseMirror .bn-drag-handle) {
  display: none !important;
}

/* 禁用编辑器的可编辑区域 */
.markdown-viewer :deep(.ProseMirror .ProseMirror-content[contenteditable='true']) {
  pointer-events: none !important;
}

/* 禁用块的hover效果 */
.markdown-viewer :deep(.bn-block) {
  pointer-events: none !important;
}

.markdown-viewer :deep(.bn-block-content) {
  pointer-events: none !important;
}

/* 禁用块的交互 */
.markdown-viewer :deep(.bn-block:hover .bn-drag-handle) {
  display: none !important;
}

/* 只读模式的文本样式优化 */
.markdown-viewer :deep(.bn-block-content) {
  color: #333;
  line-height: 1.8;
  cursor: default !important;
  pointer-events: auto !important;
}

.markdown-viewer :deep(.ProseMirror) {
  cursor: default !important;
}

/* 禁用快捷键 */
.markdown-viewer :deep(.ProseMirror) {
  -webkit-user-select: text !important;
  -moz-user-select: text !important;
  -ms-user-select: text !important;
  user-select: text !important;
}

/* 禁用右键菜单 */
.markdown-viewer :deep(.ProseMirror) {
  -webkit-touch-callout: none !important;
  -webkit-user-select: none !important;
  user-select: none !important;
}

/* 禁用所有块级交互 */
.markdown-viewer :deep(.bn-block-content *) {
  pointer-events: none !important;
}

/* 但允许文本选择 */
.markdown-viewer :deep(.bn-block-content) {
  -webkit-user-select: text !important;
  -moz-user-select: text !important;
  -ms-user-select: text !important;
  user-select: text !important;
  pointer-events: auto !important;
}

/* 禁用链接编辑 */
.markdown-viewer :deep(.bn-link-popover) {
  display: none !important;
}

/* 禁用斜杠命令菜单 */
.markdown-viewer :deep(.bn-slash-menu) {
  display: none !important;
}

/* 禁用格式化工具栏 */
.markdown-viewer :deep(.bn-formatting-toolbar) {
  display: none !important;
}

/* 禁用侧边菜单 */
.markdown-viewer :deep(.bn-side-menu) {
  display: none !important;
}

/* 禁用所有弹出菜单 */
.markdown-viewer :deep(.bn-popover) {
  display: none !important;
}

/* 强制禁用所有输入事件 */
.markdown-viewer :deep(.ProseMirror),
.markdown-viewer :deep(.ProseMirror *) {
  -webkit-user-modify: read-only !important;
  -moz-user-modify: read-only !important;
  -ms-user-modify: read-only !important;
  user-modify: read-only !important;
}

/* 禁用所有键盘事件，但允许鼠标选择 */
.markdown-viewer :deep(.ProseMirror) {
  pointer-events: auto !important;
}

/* 禁用 contenteditable */
.markdown-viewer :deep([contenteditable='true']) {
  contenteditable: 'false' !important;
}

/* 禁用所有输入元素 */
.markdown-viewer :deep(.ProseMirror input),
.markdown-viewer :deep(.ProseMirror textarea),
.markdown-viewer :deep(.ProseMirror [contenteditable='true']) {
  pointer-events: none !important;
  user-select: none !important;
}

/* 允许文本选择 */
.markdown-viewer :deep(.ProseMirror .bn-block-content) {
  pointer-events: auto !important;
  -webkit-user-select: text !important;
  -moz-user-select: text !important;
  -ms-user-select: text !important;
  user-select: text !important;
}

/* 标题样式 */
.markdown-viewer :deep(.bn-block-content h1) {
  font-size: 2em;
  font-weight: 600;
  margin: 0.67em 0;
  color: #1a1a1a;
}

.markdown-viewer :deep(.bn-block-content h2) {
  font-size: 1.5em;
  font-weight: 600;
  margin: 0.83em 0;
  color: #1a1a1a;
}

.markdown-viewer :deep(.bn-block-content h3) {
  font-size: 1.25em;
  font-weight: 600;
  margin: 1em 0;
  color: #1a1a1a;
}

.markdown-viewer :deep(.bn-block-content h4) {
  font-size: 1.1em;
  font-weight: 600;
  margin: 1.33em 0;
  color: #1a1a1a;
}

.markdown-viewer :deep(.bn-block-content h5) {
  font-size: 1em;
  font-weight: 600;
  margin: 1.67em 0;
  color: #1a1a1a;
}

.markdown-viewer :deep(.bn-block-content h6) {
  font-size: 0.85em;
  font-weight: 600;
  margin: 2.33em 0;
  color: #1a1a1a;
}

/* 段落样式 */
.markdown-viewer :deep(.bn-block-content p) {
  /*margin: 0.5em 0;*/
}

/* 列表样式 */
.markdown-viewer :deep(.bn-block-content ul),
.markdown-viewer :deep(.bn-block-content ol) {
  padding-left: 2em;
  margin: 0.5em 0;
}

.markdown-viewer :deep(.bn-block-content li) {
  margin: 0.25em 0;
}

/* 代码块样式 */
.markdown-viewer :deep(.bn-block-content pre) {
  background-color: #f6f8fa;
  border-radius: 6px;
  padding: 1em;
  overflow-x: auto;
  margin: 1em 0;
}

.markdown-viewer :deep(.bn-block-content code) {
  background-color: #f6f8fa;
  border-radius: 3px;
  padding: 0.2em 0.4em;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.markdown-viewer :deep(.bn-block-content pre code) {
  background-color: transparent;
  padding: 0;
}

/* 引用样式 */
.markdown-viewer :deep(.bn-block-content blockquote) {
  border-left: 4px solid #409eff;
  padding-left: 1em;
  margin: 1em 0;
  color: #666;
  font-style: italic;
}

/* 链接样式 */
.markdown-viewer :deep(.bn-block-content a) {
  color: #409eff;
  text-decoration: none;
}

.markdown-viewer :deep(.bn-block-content a:hover) {
  text-decoration: underline;
}

/* 表格样式 */
.markdown-viewer :deep(.bn-block-content table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
}

.markdown-viewer :deep(.bn-block-content th),
.markdown-viewer :deep(.bn-block-content td) {
  border: 1px solid #e8e8e8;
  padding: 0.5em;
  text-align: left;
}

.markdown-viewer :deep(.bn-block-content th) {
  background-color: #f6f8fa;
  font-weight: 600;
}

/* 分割线样式 */
.markdown-viewer :deep(.bn-block-content hr) {
  border: none;
  border-top: 1px solid #e8e8e8;
  margin: 2em 0;
}

/* 粗体、斜体样式 */
.markdown-viewer :deep(.bn-block-content strong) {
  font-weight: 600;
}

.markdown-viewer :deep(.bn-block-content em) {
  font-style: italic;
}

/* 移除选择时的编辑提示 */
.markdown-viewer :deep(.bn-block-content ::selection) {
  background: #b3d4fc;
}

.markdown-ai :deep(.tiptap) {
  padding: 0 !important;
}

.markdown-ai :deep(.bn-inline-content) {
  &:before {
    content: '' !important;
  }

  /*display: none;*/
}
</style>
