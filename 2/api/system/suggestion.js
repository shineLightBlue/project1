import request from '@/utils/request'

// 查询用户意见收集列表
export function listSuggestion(query) {
  return request({
    url: '/system/suggestion/list',
    method: 'get',
    params: query
  })
}

// 查询用户意见收集详细
export function getSuggestion(id) {
  return request({
    url: '/system/suggestion/' + id,
    method: 'get'
  })
}

// 新增用户意见收集
export function addSuggestion(data) {
  return request({
    url: '/system/suggestion',
    method: 'post',
    data: data
  })
}

// 修改用户意见收集
export function updateSuggestion(data) {
  return request({
    url: '/system/suggestion',
    method: 'put',
    data: data
  })
}

// 删除用户意见收集
export function delSuggestion(id) {
  return request({
    url: '/system/suggestion/' + id,
    method: 'delete'
  })
}
