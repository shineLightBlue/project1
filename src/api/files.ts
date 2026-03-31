import instance from '@/api/instance.ts'

/**
 * 2.11 删除文件/移至回收站
 */
export function apiFileRemove(data: Record<string, any>) {
  return instance.post('/api/cloud/file/remove', data)
}

/**
 * 1.15 文件重命名
 */
export function apiFileRename(data: Record<string, any>) {
  return instance.post('/api/cloud/file/rename', data)
}

/**
 * 2.9 获取回收站的文件
 */
export function apiRecycleList(data: Record<string, any>) {
  return instance.post('/api/cloud/recycle/list', data)
}

/**
 * 2.1 上传文件夹
 */
export function apiFolderCreate(data: Record<string, any>) {
  return instance.post('/api/cloud/folder/create', data)
}

/**
 * 2.2 删除文件夹
 */
export function apiFolderDelete(data: Record<string, any>) {
  return instance.post('/api/cloud/folder/delete', data)
}

/**
 * 2.3 更新文件夹
 */
export function apiFolderUpdate(data: Record<string, any>) {
  return instance.post('/api/cloud/folder/update', data)
}

/**
 * 2.3 搜索
 */
export function apiSearchKeyword(data: Record<string, any>) {
  return instance.post('/api/asr/search/keyword', data)
}

/**
 * 2.3 搜索
 */
export function apiFileMove(data: Record<string, any>) {
  return instance.post('/api/cloud/file/move', data)
}

/**
 * 2.3 恢复
 */
export function apiCloudRestoreFile(data: Record<string, any>) {
  return instance.post('/api/cloud/restore/file', data)
}
