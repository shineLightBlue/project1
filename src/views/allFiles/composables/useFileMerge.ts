import { ref, type Ref } from 'vue'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'
import { uploadCloudFileBySts } from '@/api/cloudUpload.ts'
import { ElMessage } from 'element-plus'
import { useLoginStore } from '@/stores/login'
import { getDownloadUrl } from '@/api/allFiles'

export function useFileMerge(options: { mergeFileName: Ref<string>; mergeSuccess: () => void }) {
  const { mergeSuccess } = options
  const loginStore = useLoginStore()

  // 合并状态
  const isMerging = ref(false)
  const mergedFileName = ref('merged.wav')
  const mergeProgress = ref(0)

  /**
   * 合并文件主函数
   */
  async function mergeFiles(fileUrls: string[]) {
    isMerging.value = true
    mergeProgress.value = 10
    try {
      // 加载两个文件
      const file1 = await loadFile(fileUrls[0])
      const file2 = await loadFile(fileUrls[1])
      console.log('开始合并文件')
      mergeProgress.value = 20
      await mergeWithFFmpeg(file1, file2)
    } catch (error) {
      console.error('合并失败:', error)
    } finally {
      isMerging.value = false
    }
  }

  /**
   * 加载文件
   */
  async function loadFile(url: string): Promise<File> {
    const response = await fetch(url)
    const blob = await response.blob()
    const fileName = url.split('/').pop() || 'audio.jyz'
    return new File([blob], fileName, { type: blob.type })
  }

  /**
   * 使用 FFmpeg 合并文件
   */
  async function mergeWithFFmpeg(file1: File, file2: File) {
    const ffmpeg = new FFmpeg()

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
    mergeProgress.value = 30

    // 检测文件格式
    const file1Ext = getFileExtension(file1.name)
    const file2Ext = getFileExtension(file2.name)

    console.log('文件1格式:', file1Ext)
    console.log('文件2格式:', file2Ext)

    // 根据格式决定写入文件的扩展名
    const writeExt = file1Ext === 'wav' && file2Ext === 'wav' ? 'wav' : 'ogg'

    // 写入文件
    await ffmpeg.writeFile(`file1.${writeExt}`, await fetchFile(file1))
    await ffmpeg.writeFile(`file2.${writeExt}`, await fetchFile(file2))

    mergeProgress.value = 40

    // 根据输入格式决定合并策略
    let outputExt = 'wav'
    let ffmpegArgs: string[] = []

    if (file1Ext === 'wav' && file2Ext === 'wav') {
      // 两个都是WAV → 输出WAV（无损）
      outputExt = 'wav'

      const concatList = `file 'file1.${writeExt}'\nfile 'file2.${writeExt}'`
      await ffmpeg.writeFile('concat.txt', new TextEncoder().encode(concatList))

      ffmpegArgs = [
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        'concat.txt',
        '-c',
        'copy',
        `output.${outputExt}`,
      ]
    } else if (file1Ext === 'jyz' && file2Ext === 'jyz') {
      // 两个都是JYZ → 输出JYZ（Ogg/Opus）
      outputExt = 'jyz'

      const concatList = `file 'file1.${writeExt}'\nfile 'file2.${writeExt}'`
      await ffmpeg.writeFile('concat.txt', new TextEncoder().encode(concatList))

      ffmpegArgs = [
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        'concat.txt',
        '-c:a',
        'libopus',
        '-b:a',
        '128k',
        `output.ogg`,
      ]
    } else {
      // 混合格式 → 统一输出WAV
      outputExt = 'wav'

      const concatList = `file 'file1.${writeExt}'\nfile 'file2.${writeExt}'`
      await ffmpeg.writeFile('concat.txt', new TextEncoder().encode(concatList))

      ffmpegArgs = [
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        'concat.txt',
        '-c:a',
        'pcm_s16le',
        `output.${outputExt}`,
      ]
    }

    console.log('输出格式:', outputExt)
    console.log('FFmpeg命令:', ffmpegArgs.join(' '))

    // 执行合并命令
    await ffmpeg.exec(ffmpegArgs)

    // mergeProgress.value = 40

    // 读取输出文件
    const data = await ffmpeg.readFile(`output.${outputExt === 'jyz' ? 'ogg' : outputExt}`)

    // 上传到OSS
    try {
      await aliyunUpload(data, outputExt)
    } catch (uploadError) {
      console.error('OSS上传失败:', uploadError)
      ElMessage.error(`文件上传失败: ${(uploadError as Error).message}`)
    }

    // 设置下载文件名
    mergedFileName.value = `merged.${outputExt}`
  }

  /**
   * 上传到OSS
   */
  async function aliyunUpload(data: Uint8Array, outputExt: string) {
    console.log('开始上传合并后的文件到OSS...')

    try {
      const mimeType = outputExt === 'jyz' ? 'audio/ogg' : 'audio/wav'
      const fileName = `${options.mergeFileName.value}.${outputExt}`
      const blob = new Blob([data], { type: mimeType })
      const file = new File([blob], fileName, { type: mimeType })

      console.log('准备上传文件:', {
        name: file.name,
        size: file.size,
        type: file.type,
      })

      const uploadTask = uploadCloudFileBySts({
        file: file,
        userId: loginStore.loginData.userId,
        folderId: '0',
        duration: '0',
        uploadFileName: fileName,
        onProgress: (percent) => {
          // console.log(`上传进度: ${percent}%`)
          if (percent > 40) {
            mergeProgress.value = percent
          }
        },
      })

      const result = await uploadTask.promise
      console.log('✓ 文件上传成功:', result)
      // ElMessage.success('文件已保存到云端')

      // 刷新文件列表
      mergeSuccess()

      return result
    } catch (error) {
      console.error('文件上传失败:', error)
      throw new Error(`OSS上传失败: ${(error as Error).message}`)
    }
  }

  /**
   * 获取文件扩展名
   */
  function getFileExtension(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || ''
    return ext
  }

  /**
   * 滚动到当前列表
   * @param fileUuid
   */
  function scrollItem(fileUuid: string) {
    // 等待 DOM 更新后滚动到可视区域
    nextTick(() => {
      const element = document.querySelector(`[data-file-uuid="${fileUuid}"]`)
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }
    })
  }

  /**
   * 文件读取
   * @param osskey
   */
  async function getFileUrl(osskey) {
    let res = await getDownloadUrl(osskey)
    if (res.data) {
      return res.data.url
    }
  }

  /**
   * 文件合并时间
   */
  function getDay() {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const h = String(date.getHours()).padStart(2, '0')
    const min = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day} ${h}:${min}:${seconds}`
  }

  return {
    mergedFileName,
    mergeProgress,
    mergeFiles,
    scrollItem,
    getFileUrl,
    getDay,
  }
}
