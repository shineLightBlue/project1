import { apiCloudFileSave, apiCloudStsToken } from '@/api'

type ApiEnvelope = {
  code?: number | string
  msg?: string
  message?: string
  data?: any
  success?: boolean
}

export interface CloudStsParams {
  fileName: string
  fileSize: string | number
  userId: string
  folderId?: string
  duration?: string | number
  uploadMethod?: string | number
  action?: string | number
}

export interface UploadByStsParams {
  file: File
  userId: string
  folderId?: string
  duration?: string | number
  uploadFileName?: string
  onProgress?: (percent: number) => void
}

export interface UploadResult {
  fileUuid: string
  key: string
  uploadFileName: string
  [key: string]: any
}

export interface UploadTask {
  promise: Promise<UploadResult>
  xhr: XMLHttpRequest
  readonly fileUuid: string
  readonly key: string
  readonly uploadFileName: string
  abort: () => void
}

let parseBlobLoaderPromise: Promise<((file: Blob) => Promise<any>) | null> | null = null

function parseApiEnvelope(response: any): {
  envelope: ApiEnvelope
  payload: any
  code: number | string | undefined
  message: string
} {
  const raw = response ?? {}
  let envelope: ApiEnvelope = {}

  if (raw && (raw.code !== undefined || raw.success !== undefined)) {
    envelope = raw
  } else if (raw?.data && (raw.data.code !== undefined || raw.data.success !== undefined)) {
    envelope = raw.data
  } else {
    envelope = raw
  }

  const payload = envelope?.data ?? raw?.data ?? envelope
  return {
    envelope,
    payload,
    code: envelope?.code,
    message: String(envelope?.msg ?? envelope?.message ?? '')
  }
}

function isApiSuccess(code: number | string | undefined, envelope: ApiEnvelope): boolean {
  if (envelope?.success === true || code === 200 || code === '200' || code === 0 || code === '0') {
    return true
  }
  if (code === undefined && envelope && envelope.msg === undefined && envelope.message === undefined) {
    return true
  }
  return false
}

function assertApiSuccess(response: any, actionLabel: string) {
  const { envelope, code, message } = parseApiEnvelope(response)
  if (!isApiSuccess(code, envelope)) {
    throw new Error(message || `${actionLabel} failed`)
  }
  return response
}

function assertUserId(userId: string): string {
  const normalized = String(userId ?? '').trim()
  if (!normalized) {
    throw new Error('userId is required')
  }
  return normalized
}

function resolveOssStsData(stsPayload: any) {
  if (stsPayload?.['oss-web']?.data) {
    return stsPayload['oss-web'].data
  }
  if (stsPayload?.data?.host) {
    return stsPayload.data
  }
  if (stsPayload?.data && typeof stsPayload.data === 'object' && stsPayload.data.policy) {
    return stsPayload.data
  }
  if (stsPayload?.host) {
    return stsPayload
  }
  throw new Error('Invalid sts payload: missing OSS data')
}

function resolveAwsStsData(stsPayload: any) {
  if (stsPayload?.data?.accessKeyId) {
    return stsPayload.data
  }
  if (stsPayload?.accessKeyId) {
    return stsPayload
  }
  throw new Error('Invalid sts payload: missing AWS data')
}

function resolveUploadErrorMessage(responseText: string, status: number): string {
  const fallback = status <= 0 ? 'Network error' : `Upload failed: HTTP ${status}`
  if (!responseText) {
    return fallback
  }
  try {
    const parsed = JSON.parse(responseText)
    if (parsed?.code !== undefined && parsed?.code !== null) {
      if (parsed.code !== 200 && parsed.code !== '200') {
        return (
          parsed.msg ||
          parsed.message ||
          parsed.error ||
          parsed.errorMessage ||
          parsed.errMsg ||
          parsed.error_msg ||
          parsed?.data?.msg ||
          parsed?.data?.message ||
          fallback
        )
      }
    }
    if (parsed?.Status && !['OK', 'Ok', 'ok'].includes(String(parsed.Status))) {
      return parsed.Message || parsed.message || parsed.Error || parsed.error || fallback
    }
    return parsed.msg || parsed.message || parsed.error || fallback
  } catch {
    if (responseText.trim().startsWith('<?xml') || responseText.includes('<Error>')) {
      try {
        const doc = new DOMParser().parseFromString(responseText, 'text/xml')
        const codeText = String(doc.querySelector('Code')?.textContent ?? '').trim()
        const messageText = String(doc.querySelector('Message')?.textContent ?? '').trim()
        if (messageText) {
          if (
            /signing date|credential|InvalidArgument/i.test(messageText) ||
            /invalid/i.test(codeText)
          ) {
            return 'Upload credential has expired'
          }
          return messageText
        }
        if (codeText) {
          if (/InvalidArgument|invalid/i.test(codeText)) {
            return 'Upload credential has expired'
          }
          return codeText
        }
      } catch {
        // Ignore xml parse errors.
      }
    }
  }
  return fallback
}

function normalizeDurationSeconds(seconds: number): number {
  const value = Number(seconds)
  if (!Number.isFinite(value) || value <= 0) {
    return 0
  }
  return Math.round(value)
}

function splitFileName(fileName: string): { baseName: string; extension: string } {
  const normalized = String(fileName ?? '').trim()
  if (!normalized) {
    return {
      baseName: 'file',
      extension: ''
    }
  }

  const lastDotIndex = normalized.lastIndexOf('.')
  if (lastDotIndex <= 0 || lastDotIndex === normalized.length - 1) {
    return {
      baseName: normalized,
      extension: ''
    }
  }

  return {
    baseName: normalized.slice(0, lastDotIndex),
    extension: normalized.slice(lastDotIndex)
  }
}

function createEightDigitSuffix(): string {
  return String(Math.floor(Math.random() * 90000000) + 10000000)
}

function createUploadFileName(fileName: string): string {
  const { baseName, extension } = splitFileName(fileName)
  return `${baseName}_${createEightDigitSuffix()}${extension}`
}

function formatAwsTimestamp(date: Date) {
  const iso = date.toISOString()
  return iso.replace(/[:-]|\.\d{3}/g, '')
}

function formatFileTime(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

function encodeS3KeyPath(key: string) {
  return String(key ?? '')
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}

async function sha256Hex(data: BufferSource | string): Promise<string> {
  const input =
    typeof data === 'string'
      ? new TextEncoder().encode(data)
      : data instanceof ArrayBuffer
        ? data
        : data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
  const digest = await crypto.subtle.digest('SHA-256', input)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function hmacSha256Raw(key: BufferSource, message: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    {
      name: 'HMAC',
      hash: 'SHA-256'
    },
    false,
    ['sign']
  )
  return await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message))
}

async function hmacSha256Hex(key: BufferSource, message: string): Promise<string> {
  const signature = await hmacSha256Raw(key, message)
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function createAwsAuthorization(params: {
  accessKeyId: string
  secretAccessKey: string
  sessionToken: string
  region: string
  bucket: string
  key: string
  payloadHash: string
  contentType: string
  now: Date
}) {
  const { accessKeyId, secretAccessKey, sessionToken, region, bucket, key, payloadHash, contentType, now } =
    params
  const amzDate = formatAwsTimestamp(now)
  const dateStamp = amzDate.slice(0, 8)
  const host = `${bucket}.s3.${region}.amazonaws.com`
  const canonicalUri = `/${encodeS3KeyPath(key)}`
  const canonicalHeaders = [
    `content-type:${contentType}`,
    `host:${host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`,
    `x-amz-security-token:${sessionToken}`
  ].join('\n')
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date;x-amz-security-token'
  const canonicalRequest = [
    'PUT',
    canonicalUri,
    '',
    `${canonicalHeaders}\n`,
    signedHeaders,
    payloadHash
  ].join('\n')
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    await sha256Hex(canonicalRequest)
  ].join('\n')

  const kDate = await hmacSha256Raw(new TextEncoder().encode(`AWS4${secretAccessKey}`), dateStamp)
  const kRegion = await hmacSha256Raw(kDate, region)
  const kService = await hmacSha256Raw(kRegion, 's3')
  const kSigning = await hmacSha256Raw(kService, 'aws4_request')
  const signature = await hmacSha256Hex(kSigning, stringToSign)

  return {
    url: `https://${host}${canonicalUri}`,
    amzDate,
    authorization: `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
  }
}

async function saveAwsUploadedFile(params: {
  userId: string
  fileUuid: string
  folderId: string
  file: File
  key: string
  duration: string
}) {
  const { userId, fileUuid, folderId, file, key, duration } = params
  const response = await apiCloudFileSave({
    userId,
    uploadId: fileUuid,
    fileUuid,
    fileName: file.name,
    parentId: folderId,
    folderName: folderId,
    fileSize: String(file.size),
    productSn: 'web',
    uploadType: '3',
    awsKey: key,
    fileTime: formatFileTime(new Date()),
    duration: Number(duration) || 0
  })
  assertApiSuccess(response, 'Save cloud file')
  return parseApiEnvelope(response).payload || {}
}

function getParseBlobLoader() {
  if (!parseBlobLoaderPromise) {
    parseBlobLoaderPromise = import('music-metadata-browser')
      .then((module) => module.parseBlob)
      .catch(() => null)
  }
  return parseBlobLoaderPromise
}

async function detectDurationByMetadataParser(file: File): Promise<number> {
  const parseBlob = await getParseBlobLoader()
  if (typeof parseBlob !== 'function') {
    return 0
  }
  try {
    const parsed = await parseBlob(file)
    return normalizeDurationSeconds(parsed?.format?.duration)
  } catch {
    return 0
  }
}

async function detectDurationByMediaElement(file: File): Promise<number> {
  return await new Promise<number>((resolve) => {
    const objectUrl = URL.createObjectURL(file)
    const media = document.createElement('audio')
    const cleanup = () => {
      URL.revokeObjectURL(objectUrl)
      media.src = ''
    }

    media.preload = 'metadata'
    media.onloadedmetadata = () => {
      const value = normalizeDurationSeconds(media.duration)
      cleanup()
      resolve(value)
    }
    media.onerror = () => {
      cleanup()
      resolve(0)
    }
    media.src = objectUrl
  })
}

export async function detectAudioDurationSeconds(file: File): Promise<number> {
  const metadataDuration = await detectDurationByMetadataParser(file)
  if (metadataDuration > 0) {
    return metadataDuration
  }
  return await detectDurationByMediaElement(file)
}

async function resolveUploadDuration(file: File, duration?: string | number): Promise<string> {
  const explicit = String(duration ?? '').trim()
  if (explicit && explicit !== '0') {
    return explicit
  }
  const detected = await detectAudioDurationSeconds(file)
  return String(detected || 0)
}

export async function getCloudStsToken(params: CloudStsParams) {
  const body = {
    userId: assertUserId(params.userId),
    fileSize: String(params.fileSize ?? '').trim(),
    fileName: String(params.fileName ?? '').trim(),
    uploadMethod: String(params.uploadMethod ?? '3'),
    folderId: String(params.folderId ?? '0'),
    duration: String(params.duration ?? '0'),
    action: String(params.action ?? '1')
  }

  if (!body.fileName) {
    throw new Error('fileName is required')
  }
  if (!body.fileSize) {
    throw new Error('fileSize is required')
  }

  const response = await apiCloudStsToken(body)
  assertApiSuccess(response, 'Get cloud sts token')
  return parseApiEnvelope(response).payload || {}
}

export function uploadCloudFileBySts(params: UploadByStsParams): UploadTask {
  const { file, userId, folderId = '0', duration = '0', uploadFileName, onProgress } = params
  if (!(file instanceof File)) {
    throw new Error('file must be a browser File')
  }

  const xhr = new XMLHttpRequest()
  const resolvedUploadFileName = String(uploadFileName ?? '').trim() || createUploadFileName(file.name)
  const state = {
    fileUuid: '',
    key: '',
    uploadFileName: resolvedUploadFileName
  }

  const promise = (async () => {
    const resolvedDuration = await resolveUploadDuration(file, duration)
    const stsPayload = await getCloudStsToken({
      userId,
      fileName: resolvedUploadFileName,
      fileSize: file.size,
      folderId,
      duration: resolvedDuration
    })

    const uploadType = String(stsPayload?.type ?? '').trim().toLowerCase()
    if (uploadType === 'aws') {
      const awsData = resolveAwsStsData(stsPayload)
      const fileUuid = String(awsData?.fileUuid ?? '').trim()
      const key = String(awsData?.key ?? '').trim()
      const bucket = String(awsData?.bucket ?? '').trim()
      const region = String(awsData?.region ?? '').trim()
      const accessKeyId = String(awsData?.accessKeyId ?? '').trim()
      const secretAccessKey = String(awsData?.secretAccessKey ?? '').trim()
      const sessionToken = String(awsData?.sessionToken ?? '').trim()

      if (!fileUuid || !key || !bucket || !region || !accessKeyId || !secretAccessKey || !sessionToken) {
        throw new Error('Invalid sts payload: missing AWS upload fields')
      }

      state.fileUuid = fileUuid
      state.key = key

      const payloadBuffer = await file.arrayBuffer()
      const payloadHash = await sha256Hex(payloadBuffer)
      const contentType = String(file.type || 'application/octet-stream')
      const { url, amzDate, authorization } = await createAwsAuthorization({
        accessKeyId,
        secretAccessKey,
        sessionToken,
        region,
        bucket,
        key,
        payloadHash,
        contentType,
        now: new Date()
      })

      await new Promise<void>((resolve, reject) => {
        if (typeof onProgress === 'function') {
          xhr.upload.addEventListener('loadstart', () => onProgress(0))
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable && event.total > 0) {
              const percent = Math.round((event.loaded / event.total) * 100)
              onProgress(Math.min(percent, 99))
            }
          })
          xhr.upload.addEventListener('load', () => onProgress(100))
        }

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve()
            return
          }
          reject(new Error(resolveUploadErrorMessage(String(xhr.responseText ?? ''), xhr.status)))
        })
        xhr.addEventListener('error', () => reject(new Error('Network error')))
        xhr.addEventListener('abort', () => reject(new Error('Upload aborted')))

        xhr.open('PUT', url)
        xhr.setRequestHeader('Authorization', authorization)
        xhr.setRequestHeader('Content-Type', contentType)
        xhr.setRequestHeader('x-amz-content-sha256', payloadHash)
        xhr.setRequestHeader('x-amz-date', amzDate)
        xhr.setRequestHeader('x-amz-security-token', sessionToken)
        xhr.send(file)
      })

      const saved = await saveAwsUploadedFile({
        userId: assertUserId(userId),
        fileUuid,
        folderId: String(folderId ?? '0'),
        file,
        key,
        duration: resolvedDuration
      })

      return {
        ...saved,
        fileUuid,
        key,
        uploadFileName: resolvedUploadFileName
      }
    }

    const ossData = resolveOssStsData(stsPayload)
    const fileUuid = String(ossData?.fileUuid ?? '').trim()
    if (!fileUuid) {
      throw new Error('Invalid sts payload: fileUuid is missing')
    }
    state.fileUuid = fileUuid

    if (!ossData?.host || !ossData?.callbackVar) {
      throw new Error('Invalid sts payload: host/callbackVar is missing')
    }

    const formData = new FormData()
    const dir = String(ossData.dir ?? '')
    const key = dir.endsWith(resolvedUploadFileName) ? dir : `${dir}${resolvedUploadFileName}`
    state.key = key

    formData.append('key', key)
    formData.append('policy', String(ossData.policy ?? ''))
    formData.append('x-oss-signature', String(ossData.signature ?? ''))
    formData.append('x-oss-signature-version', String(ossData.version ?? ''))
    formData.append('x-oss-credential', String(ossData.x_oss_credential ?? ''))
    formData.append('x-oss-date', String(ossData.x_oss_date ?? ''))
    formData.append('x-oss-security-token', String(ossData.security_token ?? ''))
    formData.append('success_action_status', '200')

    if (ossData.callback) {
      formData.append('callback', String(ossData.callback))
    }

    const callbackVar = JSON.parse(String(ossData.callbackVar))
    callbackVar['x:uuid'] = fileUuid
    if (
      callbackVar['x:duration'] === '' ||
      callbackVar['x:duration'] === undefined ||
      callbackVar['x:duration'] === null
    ) {
      callbackVar['x:duration'] = resolvedDuration
    }
    Object.keys(callbackVar).forEach((keyName) => {
      formData.append(keyName, String(callbackVar[keyName]))
    })
    formData.append('file', file, resolvedUploadFileName)

    return await new Promise<UploadResult>((resolve, reject) => {
      if (typeof onProgress === 'function') {
        xhr.upload.addEventListener('loadstart', () => onProgress(0))
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && event.total > 0) {
            const percent = Math.round((event.loaded / event.total) * 100)
            onProgress(Math.min(percent, 99))
          }
        })
        xhr.upload.addEventListener('load', () => onProgress(100))
      }

      xhr.addEventListener('load', () => {
        const text = String(xhr.responseText ?? '')
        if (xhr.status >= 200 && xhr.status < 300 && xhr.status !== 203) {
          let parsed: any
          try {
            parsed = text.trim() ? JSON.parse(text) : {}
          } catch {
            parsed = { data: text }
          }

          if (parsed?.code !== undefined && parsed?.code !== null && parsed.code !== 200 && parsed.code !== '200') {
            reject(new Error(parsed.msg || parsed.message || 'Upload failed'))
            return
          }
          if (parsed?.Status && !['OK', 'Ok', 'ok'].includes(String(parsed.Status))) {
            reject(new Error(parsed.Message || parsed.message || 'Upload failed'))
            return
          }

          resolve({
            ...parsed,
            fileUuid,
            key,
            uploadFileName: resolvedUploadFileName
          })
          return
        }

        reject(new Error(resolveUploadErrorMessage(text, xhr.status)))
      })

      xhr.addEventListener('error', () => reject(new Error('Network error')))
      xhr.addEventListener('abort', () => reject(new Error('Upload aborted')))

      xhr.open('POST', String(ossData.host))
      xhr.send(formData)
    })
  })()

  return {
    promise,
    xhr,
    get fileUuid() {
      return state.fileUuid
    },
    get key() {
      return state.key
    },
    get uploadFileName() {
      return state.uploadFileName
    },
    abort: () => xhr.abort()
  }
}
