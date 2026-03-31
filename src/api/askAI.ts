import { fetchSSE } from '@/utils/fetchInterceptor'
import { useLoginStore } from '@/stores/login.ts'

/**
 * AI 对话请求接口
 */

/**
 * 发送 AI 请求并获取 SSE 流
 * @param question 用户问题
 * @param transcribeId 转录ID
 * @returns 包含 reader 和 abortController 的对象
 */
export async function sendAIRequest(
  question: string,
  transcribeId: string,
): Promise<{
  reader: ReadableStreamDefaultReader<Uint8Array>
  abortController: AbortController
}> {
  const loginStore = useLoginStore()

  const { reader, abortController } = await fetchSSE('/prod-api/api/asr/meeting/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question,
      transcribeId,
      userId: loginStore.loginData.userId,
    }),
  })

  return { reader, abortController }
}
