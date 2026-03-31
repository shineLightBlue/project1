import { useLoginStore } from '@/stores/login.ts'

/**
 * Token 刷新拦截器
 * 处理 fetch 请求的 token 自动刷新
 */

let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

// token 过期提前量（毫秒），提前5分钟刷新
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000

/**
 * 解析 JWT token，获取过期时间
 */
function getTokenExpireTime(token: string): number | null {
  try {
    // JWT 格式: header.payload.signature
    const payload = token.split('.')[1]
    if (!payload) return null

    // Base64URL 解码
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = atob(base64)
    const parsed = JSON.parse(decoded)

    return parsed.exp * 1000 // 转换为毫秒
  } catch (error) {
    console.error('解析 token 失败:', error)
    return null
  }
}

/**
 * 检查 token 是否即将过期
 */
function isTokenNearExpiry(token: string): boolean {
  const expireTime = getTokenExpireTime(token)
  if (!expireTime) return false

  const currentTime = Date.now()
  const timeUntilExpiry = expireTime - currentTime

  return timeUntilExpiry < TOKEN_REFRESH_THRESHOLD
}

/**
 * 检查 token 是否已过期
 */
function isTokenExpired(token: string): boolean {
  const expireTime = getTokenExpireTime(token)
  if (!expireTime) return false
  return Date.now() >= expireTime
}

/**
 * 确保 token 有效（在请求前检查并刷新）
 */
async function ensureTokenValid(): Promise<string> {
  const loginStore = useLoginStore()
  const token = loginStore.loginData.token

  // 如果 token 已过期或即将过期，先刷新
  if (isTokenExpired(token) || isTokenNearExpiry(token)) {
    return refreshToken()
  }

  return token
}

/**
 * 订阅 token 刷新完成事件
 */
function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback)
}

/**
 * 通知所有订阅者 token 已刷新
 */
function onTokenRefreshed(newToken: string) {
  refreshSubscribers.forEach((callback) => callback(newToken))
  refreshSubscribers = []
}

/**
 * 刷新 token
 */
async function refreshToken(): Promise<string> {
  if (isRefreshing) {
    return Promise.reject('Refreshing')
  }

  isRefreshing = true

  try {
    const loginStore = useLoginStore()
    const response = await fetch('/prod-api/app/refreshToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: 'Bearer ' + loginStore.loginData.token,
        refreshToken: loginStore.loginData.refreshToken,
      }),
    })

    if (!response.ok) {
      throw new Error('Refresh failed')
    }

    const res = await response.json()
    const data = res.data

    // 更新 store 中的 token
    loginStore.loginData.token = data.token
    // 如果返回了新的 refreshToken，也一并更新
    if (data.refreshToken) {
      loginStore.loginData.refreshToken = data.refreshToken
    }

    // 通知所有等待的请求
    onTokenRefreshed(data.token)

    return data.token
  } finally {
    isRefreshing = false
  }
}

/**
 * 带有 token 刷新功能的 fetch 请求
 * 优化流程：请求前检查token是否过期，避免无效请求
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const loginStore = useLoginStore()

  try {
    // 1. 请求前先检查 token 是否需要刷新
    const token = await ensureTokenValid()

    // 2. 使用有效 token 发送请求
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    })

    // 3. 兜底处理：如果仍然返回 401（可能是刷新失败或其他原因）
    if (response.status === 401) {
      try {
        let newToken: string

        // 如果正在刷新，等待刷新完成
        if (isRefreshing) {
          newToken = await new Promise((resolve, reject) => {
            subscribeTokenRefresh(resolve)
            setTimeout(() => reject('Refresh timeout'), 5000)
          })
        } else {
          // 再次尝试刷新 token
          newToken = await refreshToken()
        }

        // 用新 token 重新发送请求
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${newToken}`,
          },
        })
      } catch (error) {
        // 刷新失败，清除登录状态
        loginStore.logout()
        window.location.href = '/login'
        throw new Error('登录已过期，请重新登录')
      }
    }

    return response
  } catch (error) {
    // 处理刷新 token 时的错误
    if (error instanceof Error && error.message === 'Refreshing') {
      // 等待刷新完成
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((newToken: string) => {
          fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              Authorization: `Bearer ${newToken}`,
            },
          })
            .then(resolve)
            .catch(reject)
        })
        setTimeout(() => reject('Refresh timeout'), 5000)
      })
    }
    throw error
  }
}

/**
 * SSE 专用请求方法
 */
export async function fetchSSE(
  url: string,
  options: RequestInit = {},
): Promise<{
  reader: ReadableStreamDefaultReader<Uint8Array>
  abortController: AbortController
}> {
  const abortController = new AbortController()

  const response = await authenticatedFetch(url, {
    ...options,
    signal: abortController.signal,
    headers: {
      ...options.headers,
      Accept: 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('Response body is not readable')
  }

  return { reader, abortController }
}
