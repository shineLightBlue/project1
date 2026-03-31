import instance from '@/api/instance.ts'

// 获取模型列表
export const getModelList = () => {
  return instance.get('/api/asr/model/list')
}

// 获取用户国家
export const getUserCountry = () => {
  return instance.get('/app/getUserCountry')
}

// 下载音频文件
export const getDownloadUrl = (awsKey: string) => {
  return instance.post('/api/cloud/downloadUrl', {
    awsKey,
    share: '0',
    type: 'oss',
  })
}

// 获取转写结果
export const getSummaryResult = (transcribeId: string) => {
  return instance.post('/api/asr/transcriptions/summaries/result', {
    transcribeId,
  })
}

/**
 * 更新转写内容
 */
export interface SentenceInfo {
  speaker: string
  text: string
  start: string
  end: string
  startMs?: number
  endMs?: number

  [key: string]: any
}

export interface SaveTranscribeParams {
  sentenceInfos: SentenceInfo[]
  transcribeId: string
  userId: string
}

export function saveTranscribe(data: SaveTranscribeParams) {
  return instance.post('/api/asr/save/transcribe', data)
}

/**
 * 翻译纪要
 */
export function getTranslateSummary(data: Record<string, any>) {
  return instance.post('/api/asr/summary/translate', data, { timeout: 120000 })
}

/**
 * 提交纪要反馈
 */
export function submitFeedback(data: Record<string, any>) {
  return instance.post('/api/asr/feedback', data)
}

/**
 * 获取纪要模板
 */
export function getSummaryTemplates({
  userId,
  status = '1',
  langCode = 'zh',
}: {
  userId: string
  status?: string
  langCode?: string
}) {
  return instance.get('/api/operations/selectCategoryWithTemplates', {
    params: {
      userId,
      status,
      langCode,
    },
  })
}

/**
 * 添加自定义模板
 */
export function addTemplate(data: {
  createBy: string
  langCode: string
  templateName: string
  previewPrompt: string
}) {
  return instance.post('/api/operations/add', data)
}

/**
 * 提交转写任务
 */
export function preTranscribe(data: Record<string, any>) {
  return instance.post('/api/asr/pre/transcribe', data)
}

/**
 * 快速转写（直接上传文件，返回转写总结结果，无需轮询）
 * 请求格式：multipart/form-data
 * 使用 XMLHttpRequest 发送 FormData，确保正确的 multipart 边界
 */
export function fastTranscribe(formData: FormData, token: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/prod-api/api/asr/fast/transcribe')
    xhr.setRequestHeader('Authorization', 'Bearer ' + token)
    xhr.timeout = 120000
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText || '{}')
        if (data?.code === 500) {
          reject(data)
        } else {
          resolve(data)
        }
      } catch {
        reject({ msg: '解析响应失败' })
      }
    }
    xhr.onerror = () => reject({ msg: '网络错误' })
    xhr.ontimeout = () => reject({ msg: '请求超时' })
    xhr.send(formData)
  })
}

/**
 * 批量转写
 */
export function batchTranscribe(data: Record<string, any>) {
  return instance.post('/api/asr/transcribeAndSummarize', data)
}

/**
 * 重新转写
 */
export function againTranscribe(data: Record<string, any>) {
  return instance.post('/api/asr/again/transcribe', data, { timeout: 0 })
}

/**
 * 获取STS上传短期凭证
 * 说明：二期接口为原2.6接口二期版本，该接口会获取aws和oss两个上传的key，返回那种由后台决定
 * app端和web端的sts参数会有不同，通过uploadMethod这个参数区分。批量转写需要上传文件也走该接口上传文件并获取URL参数，action需要传标识"3"
 * oss上传文件结束后通过回调保存文件，无需调用文件保存接口，aws上传后需要调用文件保存接口
 */
export interface GetStsTokenParams {
  /** 文件大小 */
  fileSize: string
  /** userId */
  userId: string
  /** 文件名称 */
  fileName: string
  /** 产品sn */
  productSn?: string
  /** 上传方式：1-app上传 2-设备上传 3-web上传 */
  uploadMethod: '1' | '2' | '3'
  /** 文件夹Id，0-根目录 */
  folderId: string
  /** 文件uuid，web端非必传 */
  fileUuid?: string
  /** 事件类型：1-上传 2-下载 3-临时上传(批量转写需使用文件url) */
  action: '1' | '2' | '3'
  /** 时长 */
  duration: string
}

export function getStsToken(data: GetStsTokenParams) {
  return instance.post('/api/cloud/sts/token', data)
}

/**
 * 创建分享链接
 */
export interface CreateShareLinkParams {
  transcribeId: string
  userId: string
  shareTypes: ('audio' | 'summary' | 'mindmap' | 'transcription')[]
}

export function createShareLink(data: CreateShareLinkParams) {
  return instance.post('/api/asr/share/create', data)
}

/** 分享详情（公开接口，无需登录） */
export interface ShareSummaryData {
  keywords?: string[]
  content?: string
  xmind?: string
  title?: string
  status?: string
  version?: string
  updateTime?: string
}

export interface ShareDetailData {
  shareId: string
  transcriptionId: string
  shareTypes: string[]
  expired?: boolean
  reachedLimit?: boolean
  remainingAccess?: number
  expireTime?: string
  audioUrl?: string
  transcriptionData?: Array<{
    speaker?: string
    text?: string
    start?: string
    end?: string
    startMs?: number
    endMs?: number
  }>
  summaryData?: ShareSummaryData
}

export function getShareDetail(shareId: string) {
  return instance.get(`/api/asr/get/share/${encodeURIComponent(shareId)}`, {
    showError: false,
  } as Record<string, unknown>)
}

/**
 * 4.6 更新总结内容
 * @param data
 */
export function apiAsrSaveSummary(data: Record<string, any>) {
  return instance.post('/api/asr/save/summary', data)
}
