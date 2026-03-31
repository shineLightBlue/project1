/** 需走同源代理的图片主机（避免 https 页面加载 http 资源被拦截） */
const AVATAR_IMAGE_HOST = '120.76.216.27'
/** 与线上 Nginx 一致的代理前缀，例如 /api/proxy/avatar/profile/upload/... */
const AVATAR_PROXY_PREFIX = '/api/proxy/avatar'

function encodePathSegments(pathname: string): string {
  return pathname
    .split('/')
    .map((seg) => {
      if (!seg) return ''
      try {
        return encodeURIComponent(decodeURIComponent(seg))
      } catch {
        return encodeURIComponent(seg)
      }
    })
    .join('/')
}

/**
 * 纪要模板等远程图片地址：
 * - `http(s)://120.76.216.27/profile/...` → `/api/proxy/avatar/profile/...`（路径段编码）
 * - 其它 http(s) 仅做路径编码
 * - 已是 `/api/proxy/avatar` 开头则原样返回
 */
export function safeRemoteImageUrl(url: string): string {
  if (!url || typeof url !== 'string') return ''
  const trimmed = url.trim()
  if (!trimmed) return ''

  if (trimmed.startsWith(AVATAR_PROXY_PREFIX)) return trimmed

  if (!/^https?:\/\//i.test(trimmed)) return trimmed

  try {
    const u = new URL(trimmed)
    const encodedPath = encodePathSegments(u.pathname)

    if (u.hostname === AVATAR_IMAGE_HOST) {
      return `${AVATAR_PROXY_PREFIX}${encodedPath}${u.search}${u.hash}`
    }

    u.pathname = encodedPath
    return u.href
  } catch {
    return trimmed
  }
}
