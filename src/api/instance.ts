/**
 * Axios 实例：统一 baseURL、超时，请求拦截器携带 token，响应拦截器处理 500 与 session 过期。
 * session 过期时自动尝试刷新 token 并重试原请求，刷新失败或无 refreshToken 时清空登录态并跳转 /login。
 * 供 @/api 下所有接口使用。
 */
// http://www.axios-js.com/zh-cn/docs/
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useLoginStore } from '@/stores/login.ts'
import router from '@/router'

declare module 'axios' {
  interface AxiosRequestConfig {
    /**
     * 是否在 API 请求失败时显示全局错误提示。
     * @default true
     */
    showError?: boolean
  }
}

/** 刷新 token 的接口路径，用于识别刷新请求避免递归 */
const REFRESH_PATH = '/app/refreshToken'

/** 刷新中的 Promise，用于并发 500 时只发起一次刷新 */
let refreshPromise: Promise<{ token: string; refreshToken: string }> | null = null

function isRefreshTokenRequest(config: any) {
  return config?.url?.includes(REFRESH_PATH) || config?.__isRefreshTokenRequest
}

/** 是否为 session 过期（需要刷新 token）*/
function isSessionExpired(data: any) {
  if (!data || data?.code !== 500) return false
  const msgCode = String(data.msgCode ?? '').trim()
  const msg = String(data.msg ?? data.message ?? '').trim()
  if (msgCode === '16') return true
  return /session\s*过期|刷新\s*token|token\s*过期/i.test(msg)
}

const instance = axios.create({
  baseURL: '/prod-api/',
  timeout: 10 * 60 * 1000, // 10分钟
})

/** 调用刷新 token 接口并更新 store；并发时复用同一 Promise；失败则清空 token 并跳转登录 */
async function doRefresh(): Promise<{ token: string; refreshToken: string }> {
  if (refreshPromise) return refreshPromise
  const loginStore = useLoginStore()
  const { token, refreshToken } = loginStore.loginData
  if (!token || !refreshToken) {
    const e = new Error('Missing token or refresh token')
    refreshPromise = null
    throw e
  }
  refreshPromise = (async () => {
    const refreshConfig = {
      method: 'POST' as const,
      url: REFRESH_PATH,
      data: { noLogin: true, token, refreshToken },
      __isRefreshTokenRequest: true,
    }
    const res = await instance
      .request(refreshConfig as Parameters<typeof instance.request>[0])
      .catch((err) => {
        const body = err?.response?.data ?? err
        throw new Error(body?.msg ?? body?.message ?? '刷新 token 失败')
      })
    const payload = res as any
    const inner = payload?.data ?? payload
    const newToken = inner?.token ?? inner?.accessToken ?? ''
    const newRefreshToken = inner?.refreshToken ?? ''
    if (!newToken || !newRefreshToken) {
      throw new Error('刷新结果缺少 token 或 refreshToken')
    }
    loginStore.setLoginStore({
      ...loginStore.loginData,
      token: newToken,
      refreshToken: newRefreshToken,
    })
    return { token: newToken, refreshToken: newRefreshToken }
  })()
  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}

/** 清空登录态（token/refreshToken）并跳转到 /login */
function clearLoginAndRedirect() {
  const loginStore = useLoginStore()
  loginStore.setLoginStore({
    ...loginStore.loginData,
    token: '',
    refreshToken: '',
  })
  router.replace('/login')
}

// 请求拦截器：非 noLogin 的请求自动在 Header 中携带 Bearer token
instance.interceptors.request.use(
  function (config) {
    const loginStore = useLoginStore()
    const token = loginStore.loginData.token
    const noLogin = Boolean((config.data as any)?.noLogin ?? (config.params as any)?.noLogin)
    if (token && !noLogin) {
      config.headers.Authorization = 'Bearer ' + token
    }
    return config
  },
  function (error) {
    return Promise.reject(error)
  },
)

// 响应拦截器：200 返回 data；500 且 session 过期则尝试刷新 token 并重试，否则提示并 reject
instance.interceptors.response.use(
  function (response) {
    const data = response.data
    const config = response.config

    if (data?.code === 500) {
      const text = data.msg ?? data.msgCode ?? ''
      const isRefreshReq = isRefreshTokenRequest(config)

      if (isSessionExpired(data)) {
        // 当前请求就是刷新 token：刷新失败，直接清空登录并跳转
        if (isRefreshReq) {
          if (text && config.showError !== false) ElMessage.warning(text)
          clearLoginAndRedirect()
          return Promise.reject(data)
        }
        // 无 refreshToken：无法刷新，清空登录并跳转
        const loginStore = useLoginStore()
        if (!loginStore.loginData.refreshToken) {
          if (text && config.showError !== false) ElMessage.warning(text)
          clearLoginAndRedirect()
          return Promise.reject(data)
        }
        // 有 refreshToken：先刷新再重试原请求，失败则清空登录并跳转
        return doRefresh()
          .then(() => instance.request(config))
          .catch(() => {
            clearLoginAndRedirect()
            return Promise.reject(data)
          })
      }

      if (text && config.showError !== false) ElMessage.warning(text)
      return Promise.reject(data)
    }

    if (data?.code === 200) {
      return data
    }
    return Promise.reject(data)
  },
  function (error) {
    const body = error.response?.data
    const config = error.config

    if (body && (body.code === 500 || body.msg || body.msgCode)) {
      const text = body.msg ?? body.msgCode ?? ''
      const isRefreshReq = config ? isRefreshTokenRequest(config) : false

      if (isSessionExpired(body)) {
        if (isRefreshReq) {
          if (text && config.showError !== false) ElMessage.warning(text)
          clearLoginAndRedirect()
          return Promise.reject(error)
        }
        const loginStore = useLoginStore()
        if (!loginStore.loginData.refreshToken) {
          if (text && config.showError !== false) ElMessage.warning(text)
          clearLoginAndRedirect()
          return Promise.reject(error)
        }
        return doRefresh()
          .then(() => instance.request(config))
          .catch(() => {
            clearLoginAndRedirect()
            return Promise.reject(error)
          })
      }

      if (text && config.showError !== false) ElMessage.warning(text)
    }
    return Promise.reject(error)
  },
)

export default instance
