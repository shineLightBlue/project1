/**
 * 获取远程文件的头部字节
 * @param url 文件 URL
 * @param bytes 要读取的字节数（默认 512）
 * @returns ArrayBuffer
 */
export async function getFileHeader(url: string, bytes: number = 512): Promise<ArrayBuffer> {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Range': `bytes=0-${bytes - 1}` // 只请求前 N 个字节
    }
  })

  if (!response.ok) {
    throw new Error(`获取文件头失败: ${response.status} ${response.statusText}`)
  }

  return await response.arrayBuffer()
}

/**
 * 将 ArrayBuffer 转换为十六进制字符串
 * @param buffer ArrayBuffer
 * @param bytes 每行显示的字节数（默认 16）
 * @returns 格式化的十六进制字符串
 */
export function bufferToHexDump(buffer: ArrayBuffer, bytesPerLine: number = 16): string {
  const uint8Array = new Uint8Array(buffer)
  const lines: string[] = []

  for (let i = 0; i < uint8Array.length; i += bytesPerLine) {
    const chunk = uint8Array.slice(i, i + bytesPerLine)
    const hexValues = Array.from(chunk)
      .map(b => b.toString(16).padStart(2, '0'))
      .join(' ')
    const asciiValues = Array.from(chunk)
      .map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.')
      .join('')

    const offset = i.toString(16).padStart(8, '0')
    lines.push(`${offset}  ${hexValues.padEnd(bytesPerLine * 3 - 1)}  |${asciiValues}|`)
  }

  return lines.join('\n')
}

/**
 * 解析文件签名（Magic Number）
 * @param buffer ArrayBuffer
 * @returns 文件类型信息
 */
export function parseFileSignature(buffer: ArrayBuffer): {
  signature: string
  signatureHex: string
  possibleFormats: string[]
} {
  const uint8Array = new Uint8Array(buffer)
  const signatureBytes = uint8Array.slice(0, 16) // 读取前 16 字节
  const signatureHex = Array.from(signatureBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join(' ')
  const signature = Array.from(signatureBytes)
    .map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.')
    .join('')

  // 常见音频文件签名
  const formatSignatures: Record<string, string[]> = {
    'Ogg Vorbis/Opus': ['4f 67 67 53'], // OggS
    'MP3': ['49 44 33', 'ff fb', 'ff fa', 'ff e3'], // ID3v2, MPEG Layer 3
    'WAV': ['52 49 46 46'], // RIFF
    'FLAC': ['66 4c 61 43'], // fLaC
    'AAC': ['ff f1', 'ff f9'], // ADTS AAC
    'M4A/MP4': ['00 00 00'], // 需要进一步检查 ftyp
  }

  const possibleFormats: string[] = []
  const hexPrefixes = Object.values(formatSignatures).flat()

  for (const [format, signatures] of Object.entries(formatSignatures)) {
    for (const sig of signatures) {
      if (signatureHex.startsWith(sig)) {
        if (!possibleFormats.includes(format)) {
          possibleFormats.push(format)
        }
      }
    }
  }

  return {
    signature,
    signatureHex,
    possibleFormats
  }
}

/**
 * JiayzTag 自定义结构体
 */
export interface OpusJiayzHeader {
  magic: string              // "JiayzTag"
  timeStamp: number          // 时间戳(元数据时间码)
  tagLen: number            // Tag列表长度
  tagList: number[]         // Tag列表
}

/**
 * 解析 JiayzTag 自定义结构体
 * @param buffer ArrayBuffer
 * @param offset 偏移地址（默认 0xF5 = 245）
 * @returns 解析后的结构体数据
 */
export function parseJiayzHeader(buffer: ArrayBuffer, offset: number = 0xF5): OpusJiayzHeader | null {
  const view = new DataView(buffer)
  const uint8Array = new Uint8Array(buffer)

  // 检查缓冲区是否足够大
  if (buffer.byteLength < offset + 24) { // 至少需要 8+8+4+4 = 24 字节
    console.error('缓冲区太小，无法解析 JiayzHeader')
    return null
  }

  try {
    // 1. 解析 magic (8 字节)
    const magicBytes = uint8Array.slice(offset, offset + 8)
    const magic = new TextDecoder('ascii').decode(magicBytes)

    // 验证 magic 是否为 "JiayzTag"
    if (magic !== 'JiayzTag') {
      return null
    }

    // 2. 解析 timeStamp (uint64_t, 8 字节，小端序)
    const timeStampLow = view.getUint32(offset + 8, true)
    const timeStampHigh = view.getUint32(offset + 12, true)
    const timeStamp = timeStampLow + (timeStampHigh * 0x100000000)

    // 3. 解析 tagLen (uint32_t, 4 字节，小端序)
    const tagLen = view.getUint32(offset + 16, true)

    // 4. 解析 tagList (uint32_t 数组)
    const tagList: number[] = []
    const tagListOffset = offset + 20
    const maxTags = Math.min(tagLen, (buffer.byteLength - tagListOffset) / 4)

    for (let i = 0; i < maxTags; i++) {
      const tagValue = view.getUint32(tagListOffset + i * 4, true)
      tagList.push(tagValue)
    }

    const header: OpusJiayzHeader = {
      magic,
      timeStamp,
      tagLen,
      tagList
    }

    console.log('=== JiayzTag 结构体解析结果 ===')
    console.log(`偏移地址: 0x${offset.toString(16).toUpperCase()}`)
    console.log(`Magic: "${magic}"`)
    console.log(`时间戳: ${timeStamp} (${new Date(timeStamp * 1000).toISOString()})`)
    console.log(`Tag列表长度: ${tagLen}`)
    console.log(`Tag列表:`, tagList)

    return header
  } catch (error) {
    console.error('解析 JiayzHeader 失败:', error)
    return null
  }
}

/**
 * 是否为 .jyz 音频（仅此类文件需在头部解析 JiayzTag）
 */
export function isJyzFileName(name: string): boolean {
  return /\.jyz$/i.test((name || '').trim())
}

/**
 * 从音频下载 URL 的路径推断是否为 .jyz（分享页等无单独文件名字段时使用）
 */
export function isJyzAudioUrl(url: string): boolean {
  const raw = (url || '').trim()
  if (!raw) return false
  try {
    const u = new URL(raw, 'http://dummy.local')
    const last = decodeURIComponent(u.pathname.split('/').pop() || '')
    return isJyzFileName(last)
  } catch {
    const noQuery = raw.split('?')[0] || ''
    const last = decodeURIComponent(noQuery.split('/').pop() || '')
    return isJyzFileName(last)
  }
}

/**
 * 完整的文件头分析函数（解析 JiayzTag 时请仅对 .jyz 文件调用）
 * @param url 文件 URL
 * @param bytes 要读取的字节数
 * @param options.parseJiayz 是否解析 JiayzTag（默认 true；非 jyz 文件可传 false 省一次解析）
 * @returns 分析结果
 */
export async function analyzeFileHeader(
  url: string,
  bytes: number = 512,
  options?: { parseJiayz?: boolean }
) {
  const parseJiayz = options?.parseJiayz !== false
  const buffer = await getFileHeader(url, bytes)
  const hexDump = bufferToHexDump(buffer)
  const signatureInfo = parseFileSignature(buffer)

  console.log(`[fileHeaderPreview] ${new Date().toISOString()} | ${bytes} bytes | HTTP 206`)
  console.log(hexDump)
  console.log('文件签名分析:', signatureInfo)

  const jiayzHeader = parseJiayz ? parseJiayzHeader(buffer, 0xF5) : null

  return {
    buffer,
    hexDump,
    signatureInfo,
    jiayzHeader,
    size: bytes
  }
}
