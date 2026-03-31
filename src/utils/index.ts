/**
 * 动态加载 SVG 图标
 * 使用 import.meta.glob 让 Vite 能够静态分析，确保 SVG 文件被正确构建
 */

// 静态导入所有 SVG 文件（构建时处理）
const svgModules = import.meta.glob('../assets/images/*.svg', {
  eager: true,
  as: 'url',
})

/**
 * 获取 SVG 图标的 URL
 * @param name 图标名称（不带扩展名）
 * @returns SVG 图标的 URL
 */
export function loadSvg(name: string): string {
  const key = `../assets/images/${name}.svg`
  if (key in svgModules) {
    return svgModules[key] as string
  }
  console.warn(`Icon not found: ${name}`)
  return ''
}

/**
 * 防抖函数
 * @param fn 要执行的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300,
): (...args: any[]) => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  return function (this: any, ...args: any[]) {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      fn.apply(this, args)
      timer = null
    }, delay)
  }
}

export function getSessionStorage(key: string) {
  return sessionStorage.getItem(key)
}

export function setSessionStorage(key: string, value: string) {
  sessionStorage.setItem(key, value)
}

export function removeSessionStorage(key: string) {
  sessionStorage.removeItem(key)
}
