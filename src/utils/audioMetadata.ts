import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

/**
 * 音频元数据接口
 */
export interface AudioMetadata {
  format: {
    format_name: string
    format_long_name: string
    duration: string
    size: string
    bit_rate: string
  }
  streams: Array<{
    codec_name: string
    codec_long_name: string
    codec_type: string
    sample_rate: string
    channels: number
    channel_layout: string
    duration: string
    bit_rate: string
  }>
  error?: string
}

/**
 * 使用 ffmpeg 获取音频元数据
 * @param audioUrl 音频文件的 URL
 * @returns 音频元数据对象
 */
export async function getAudioMetadata(audioUrl: string): Promise<AudioMetadata | null> {
  let ffmpeg: FFmpeg | null = null
  const logs: any[] = []

  try {
    // 初始化 FFmpeg 实例
    ffmpeg = new FFmpeg()

    // 设置日志监听器
    ffmpeg.on('log', ({ message, type }) => {
      logs.push({ message, type })
      console.log(`[FFmpeg ${type}]`, message)
    })

    // FFmpeg 配置
    const baseURL = '/ffmpeg'
    const coreURL = `${baseURL}/ffmpeg-core.js`
    const wasmURL = `${baseURL}/ffmpeg-core.wasm`
    const classWorkerURL = `${baseURL}/ffmpeg-core.worker.js`

    await ffmpeg.load({
      coreURL,
      wasmURL,
      classWorkerURL,
    })
    console.log('✓ FFmpeg 加载成功')

    // 下载音频文件
    const response = await fetch(audioUrl)
    if (!response.ok) {
      throw new Error(`下载音频失败: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const fileName = `input.${getFileExtension(audioUrl)}`

    // 将音频文件写入 ffmpeg 文件系统
    await ffmpeg.writeFile(fileName, new Uint8Array(arrayBuffer))

    console.log('写入成功')

    // 列出文件系统中的文件
    const files = await ffmpeg.listDir('/')
    console.log('文件系统中的文件:', files)

    // 使用 ffmpeg 获取元数据（将输出重定向到 null 设备）
    await ffmpeg.exec([
      '-i',
      fileName,
      '-f',
      'null',
      '-',
    ])
    console.log('exec成功')

    console.log('收集到的日志数量:', logs.length)

    // 尝试解析日志中的元数据信息
    const metadata = parseFFmpegLogs(logs)

    console.log('音频元数据:', metadata)

    return metadata
  } catch (error) {
    console.error('获取音频元数据失败:', error)
    return {
      format: {
        format_name: 'unknown',
        format_long_name: 'unknown',
        duration: '0',
        size: '0',
        bit_rate: '0',
      },
      streams: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  } finally {
    // 清理 ffmpeg 实例
    if (ffmpeg) {
      try {
        await ffmpeg.terminate()
      } catch (e) {
        console.warn('清理 ffmpeg 实例失败:', e)
      }
    }
  }
}

/**
 * 从 URL 中提取文件扩展名
 * @param url 文件 URL
 * @returns 文件扩展名（不包含点号）
 */
function getFileExtension(url: string): string {
  const match = url.match(/\.([^.?]+)(?:\?|$)/)
  return match ? match[1] : 'bin'
}

/**
 * 解析 FFmpeg 日志，提取音频元数据
 * @param logs FFmpeg 日志数组
 * @returns 解析出的元数据
 */
function parseFFmpegLogs(logs: any[]): AudioMetadata {
  const metadata: AudioMetadata = {
    format: {
      format_name: 'unknown',
      format_long_name: 'unknown',
      duration: '0',
      size: '0',
      bit_rate: '0',
    },
    streams: [],
  }

  // 合并所有日志消息
  const logText = logs.map((log) => log.message).join('\n')
  console.log('合并后的日志:', logText)

  // 提取 Duration
  const durationMatch = logText.match(/Duration:\s+(\d+):(\d+):(\d+\.\d+)/)
  if (durationMatch) {
    const hours = parseInt(durationMatch[1])
    const minutes = parseInt(durationMatch[2])
    const seconds = parseFloat(durationMatch[3])
    metadata.format.duration = (hours * 3600 + minutes * 60 + seconds).toString()
  }

  // 提取 start time
  const startMatch = logText.match(/start:\s+(\d+\.\d+)/)
  if (startMatch) {
    // 可以计算实际时长
  }

  // 提取 bitrate
  const bitrateMatch = logText.match(/bitrate:\s+(\d+)\s+kb\/s/)
  if (bitrateMatch) {
    metadata.format.bit_rate = (parseInt(bitrateMatch[1]) * 1000).toString()
  }

  // 查找音频流信息
  const audioStreamMatch = logText.match(/Stream\s+#\d+:\d+.*Audio:\s+([^,\s]+)/)
  if (audioStreamMatch) {
    const codecName = audioStreamMatch[1]

    // 提取采样率
    const sampleRateMatch = logText.match(/(\d+)\s+Hz/)
    const sampleRate = sampleRateMatch ? sampleRateMatch[1] : '0'

    // 提取通道数
    const channelsMatch = logText.match(/(stereo|mono)/i)
    let channels = 0
    if (channelsMatch) {
      channels = channelsMatch[0].toLowerCase() === 'stereo' ? 2 : 1
    }

    metadata.streams.push({
      codec_name: codecName,
      codec_long_name: codecName,
      codec_type: 'audio',
      sample_rate: sampleRate,
      channels: channels,
      channel_layout: channels === 2 ? 'stereo' : 'mono',
      duration: metadata.format.duration,
      bit_rate: metadata.format.bit_rate,
    })
  }

  return metadata
}

/**
 * 获取音频时长的便捷函数
 * @param audioUrl 音频文件的 URL
 * @returns 音频时长（秒），如果获取失败返回 null
 */
export async function getAudioDuration(audioUrl: string): Promise<number | null> {
  const metadata = await getAudioMetadata(audioUrl)
  if (!metadata || metadata.error) {
    return null
  }
  return parseFloat(metadata.format.duration) || null
}

/**
 * 获取音频采样率的便捷函数
 * @param audioUrl 音频文件的 URL
 * @returns 音频采样率（Hz），如果获取失败返回 null
 */
export async function getAudioSampleRate(audioUrl: string): Promise<number | null> {
  const metadata = await getAudioMetadata(audioUrl)
  if (!metadata || metadata.error) {
    return null
  }

  // 查找音频流
  const audioStream = metadata.streams.find((stream) => stream.codec_type === 'audio')
  return audioStream ? parseInt(audioStream.sample_rate) : null
}

/**
 * 获取音频通道数的便捷函数
 * @param audioUrl 音频文件的 URL
 * @returns 音频通道数，如果获取失败返回 null
 */
export async function getAudioChannels(audioUrl: string): Promise<number | null> {
  const metadata = await getAudioMetadata(audioUrl)
  if (!metadata || metadata.error) {
    return null
  }

  // 查找音频流
  const audioStream = metadata.streams.find((stream) => stream.codec_type === 'audio')
  return audioStream ? audioStream.channels : null
}
