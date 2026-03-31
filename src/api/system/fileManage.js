import request from '@/utils/request'

// 查询文件管理列表
export function listFileManage(query) {
  return request({
    url: '/system/file/list',
    method: 'get',
    params: query
  })
}

// 查询文件处理历史
export function getFileHistory(fileId) {
  return request({
    url: '/system/file/history/' + fileId,
    method: 'get'
  })
}

// 查询任务列表
export function listTask(query) {
  return request({
    url: '/system/file/task/list',
    method: 'get',
    params: query
  })
}

//查询转写记录
export function listTranscriptionRecord(query) {
  return request({
    url: '/system/file/selectTranscriptionList',
    method: 'get',
    params: query
  })
}

//查询纪要记录
export function listSummaryRecord(query) {
  return request({
    url: '/system/file/selectSummaryList',
    method: 'get',
    params: query
  })
}

//查询纪要模板
export function listSummaryTemplate(query) {
  return request({
    url: '/system/summaryTemplate/list',
    method: 'get',
    params: query
  })
}

//修改纪要模板
export function updateSummaryTemplate(data) {
  return request({
    url: '/system/summaryTemplate/edit',
    method: 'post',
    data: data
  })
}
//修改纪要模板
export function updateSummaryTemplateBatch(data) {
  return request({
    url: '/system/summaryTemplate/editBatch',
    method: 'post',
    data: data
  })
}
//修改纪要模板
export function addSummaryTemplateBatch(data) {
  return request({
    url: '/system/summaryTemplate/addBatch',
    method: 'post',
    data: data
  })
}
export function getModel(){
    return request({
    url: '/system/file/selectModel',
    method: 'get'
  })
}

export function getSummaryModel(){
    return request({
    url: '/system/file/selectSummaryModel',
    method: 'get'
  })
}

// 查询模板详细
export function getInfo(id) {
  return request({
    url: '/system/summaryTemplate/' + id,
    method: 'get'
  })
}
export function getInfoList(id) {
  return request({
    url: '/system/summaryTemplate/selectTemplateByCode',
    method: 'get',
    params: {
      templateCode:id
    }
  })
}
//查询纪要模板
export function listTemplateCategory(langCode) {
  return request({
    url: '/system/summaryTemplate/selectTemplate',
    method: 'get',
    params: {
      lang:langCode
    }
  })
}