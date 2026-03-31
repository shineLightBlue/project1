<template>
  <div class="wrap flex">
    <!-- 导航 -->
    <div class="nav flex-center">
      <img src="@/assets/images/icon_ask_ai.svg" alt="" />
      <div class="flex1"></div>
      <img
        src="@/assets/images/icon_askai_side_recycle.svg"
        alt=""
        class="pointer"
        @click="showConfirm"
      />
      <img
        class="close"
        src="@/assets/images/icon_askai_side_close.svg"
        alt=""
        @click="emits('close')"
      />
    </div>
    <!-- 内容 -->
    <div class="content flex1" ref="contentRef">
      <div class="messages">
        <div v-for="(msg, index) in messages" :key="index" :class="['message', msg.role]">
          <div class="message-content">
            <!-- 用户消息显示纯文本 -->
            <span v-if="msg.role === 'user'">{{ msg.content }}</span>
            <!-- 助手消息使用 MarkdownViewer 渲染 -->
            <MarkdownViewer v-else :content="msg.content" />
          </div>
        </div>
      </div>
      <!-- 动画 -->
      <div v-if="isAsking && !isTyping">
        <div class="linear"></div>
        <div class="linear"></div>
        <div class="linear short"></div>
      </div>
    </div>
    <!-- 输入框 -->
    <div class="ask border flex">
      <img class="logo" :src="loadSvg('icon_ask_ai')" alt="" />
      <textarea
        class="input flex1"
        :placeholder="
          !isFollowUp ? t('layout.askAI.inputPlaceholder') : t('layout.askAI.followUpPlaceholder')
        "
        v-model="mes"
      ></textarea>
      <img
        class="send"
        :src="loadSvg(isAsking ? 'icon-askai-stop' : 'icon_askai_send')"
        alt=""
        @click="send"
      />
    </div>
  </div>

  <!-- 删除确认 -->
  <DeleteDialog
    v-model="deleteShow"
    :title="t('layout.askAI.clearConfirm.title')"
    @confirm-delete="confirmDelete"
  >
    <p>{{ t('layout.askAI.clearConfirm.message') }}</p>
  </DeleteDialog>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { useLoginStore } from '@/stores/login.ts'
import { loadSvg } from '@/utils'
import DeleteDialog from '@/components/deleteDialog.vue'
import MarkdownViewer from '@/views/allFiles/MarkdownViewer.vue'
import { sendAIRequest } from '@/api/askAI'

const props = defineProps(['id'])
const emits = defineEmits(['close'])
const loginStore = useLoginStore()
const { t } = useI18n()

const mes = ref('')
const result = ref('')
const contentRef = ref<HTMLElement>()

// 对话历史
const messages = ref<Array<{ role: 'user' | 'assistant'; content: string }>>([])

// 打字机效果
const charQueue: string[] = []
const isTyping = ref(false)
const isAsking = ref(false) // 正在回答
const isFollowUp = ref(false) // 追问
let abortController: AbortController | null = null // 用于中断请求

// 主发送函数
async function send() {
  if (!props.id) return
  if (isAsking.value) {
    stopApi()
    return
  }

  const userMessage = mes.value.trim()
  if (!userMessage) return

  // 添加用户消息
  messages.value.push({
    role: 'user',
    content: userMessage,
  })

  // 添加空的助手消息
  messages.value.push({
    role: 'assistant',
    content: '',
  })

  scrollToBottom()

  try {
    isAsking.value = true
    await sendRequest()
  } catch (error) {
    console.error('请求失败:', error)
    // 如果不是用户主动中断的错误，才显示错误信息
    if (!(error instanceof DOMException && error.name === 'AbortError')) {
      isAsking.value = false
      const lastMsg = messages.value[messages.value.length - 1]
      if (lastMsg && lastMsg.role === 'assistant') {
        lastMsg.content = t('layout.askAI.error') || '请求失败，请重试'
      }
    }
  } finally {
    // 清理 abortController
    abortController = null
  }
  mes.value = ''
}

/**
 * 中断请求
 */
function stopApi() {
  // 中断请求
  if (abortController) {
    abortController.abort()
    abortController = null
  }

  // 清理打字机队列
  charQueue.length = 0

  // 重置状态
  isTyping.value = false
  isAsking.value = false
  isFollowUp.value = false

  console.log('请求已中断')
}

/**
 * 自动滚动到底部
 */
function scrollToBottom() {
  nextTick(() => {
    if (contentRef.value) {
      contentRef.value.scrollTop = contentRef.value.scrollHeight
    }
  })
}

// 发送请求
async function sendRequest() {
  try {
    const { reader, abortController: controller } = await sendAIRequest(mes.value, props.id)

    // 保存 abortController 以便能够中断请求
    abortController = controller

    await readStreamData(reader)
  } catch (error) {
    console.error('请求失败:', error)
    throw error
  }
}

/**
 * 读取流数据
 * @param reader
 */
async function readStreamData(reader: ReadableStreamDefaultReader<Uint8Array>) {
  const decoder = new TextDecoder()

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const text = decoder.decode(value, { stream: true })
      const lines = text.split('\n')

      for (const line of lines) {
        const chunk = parseSSEData(line)
        if (chunk) {
          addCharsToQueue(chunk)
        }
      }
    }
  } catch (error) {
    // 如果是用户主动中断，不需要显示错误
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.log('请求已中断')
      return
    }
    throw error
  }
}

/**
 * 解析 SSE 数据
 * @param line
 */
function parseSSEData(line: string) {
  const trimmedLine = line.trim()
  if (!trimmedLine.startsWith('data:')) return null

  const dataStr = trimmedLine.slice(5).trim()
  try {
    const parsed = JSON.parse(dataStr)
    return parsed.data?.chunk || null
  } catch (e) {
    console.error('❌ JSON 解析失败:', e)
    return null
  }
}

/**
 * 添加字符到队列
 * @param text
 */
function addCharsToQueue(text: string) {
  const chars = text.split('')
  charQueue.push(...chars)
  if (!isTyping.value) {
    typeWriter()
  }
}

/**
 * 打字效果
 */
async function typeWriter() {
  if (isTyping.value || charQueue.length === 0) return

  isTyping.value = true
  while (charQueue.length > 0 && isAsking.value) {
    const char = charQueue.shift()
    if (char) {
      // 更新最后一条助手消息
      const lastMsg = messages.value[messages.value.length - 1]
      if (lastMsg && lastMsg.role === 'assistant') {
        lastMsg.content += char
        scrollToBottom()
      }
      await new Promise((resolve) => setTimeout(resolve, 30))
    }
  }
  isTyping.value = false
  isAsking.value = false
  isFollowUp.value = true
}

// ===============  删除弹窗
const deleteShow = ref(false)

function showConfirm() {
  if (!messages.value.length) {
    return
  }
  deleteShow.value = true
}

function confirmDelete() {
  messages.value = []
  deleteShow.value = false
  isFollowUp.value = false
  ElMessage.success(t('file.askAIDelete'))
}
</script>

<style lang="scss" scoped>
.wrap {
  background: #fff;
  height: 100vh;
  flex-direction: column;
  box-sizing: border-box;
  padding-bottom: 30px;
}

.nav {
  padding: 0 20px;
  height: 65px;

  .close {
    margin-left: 20px;
    cursor: pointer;
  }
}

.content {
  padding: 20px;
  overflow-y: auto;
  overflow-x: hidden;

  .messages {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .message {
    display: flex;
    width: 100%;

    &.user {
      justify-content: flex-end;

      .message-content {
        background: #eef4fe;
        border-radius: 12px 12px 4px 12px;
        position: relative;

        &:after {
          content: '';
          position: absolute;
          width: 20px;
          height: 20px;
          right: -20px;
          bottom: 0;
          background: radial-gradient(circle at 100% 0, transparent 20px, #eef4fe 21px);
        }
      }
    }

    &.assistant {
      justify-content: flex-start;
    }

    .message-content {
      padding: 8px 16px;
      line-height: 1.6;
      word-wrap: break-word;
    }

    /* MarkdownViewer 样式调整 */
    .message-content :deep(.markdown-viewer) {
      width: 100%;
    }
  }
}

.ask {
  margin: 0 auto;
  width: 422px;
  height: 112px;
  border-radius: 6px;
  padding: 20px 10px 10px 20px;
  box-sizing: border-box;

  .logo {
    display: block;
    width: 22px;
    height: 22px;
    margin-right: 10px;
  }

  .input {
    border: none;
    resize: none;
  }

  .send {
    width: 20px;
    height: 20px;
    align-self: end;
    margin-left: 10px;
    cursor: pointer;
  }
}

.border {
  border: 1px solid transparent;
  background-image:
    linear-gradient(to top, #fff, #fff),
    linear-gradient(to right, #0051ff, #0075ff, #12acff, #24e3ff);
  background-origin: border-box;
  background-clip: padding-box, border-box;
}

.linear {
  background-image: linear-gradient(to left, rgba(64, 135, 255, 0.9), rgba(15, 203, 255, 0.6));
  background-size: 200% 200%;
  height: 22px;
  width: 100%;
  opacity: 0.2;
  border-radius: 6px;
  margin-bottom: 15px;
  animation: gradientMove 1.5s ease infinite;

  &.short {
    width: 80%;
  }
}

@keyframes gradientMove {
  0% {
    background-position: 0 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}
</style>
