import request from '@/utils/request'

// 查询大模型配置列表
export function listModel(query) {
  return request({
    url: '/model/model/list',
    method: 'get',
    params: query
  })
}

// 查询大模型配置详细
export function getModel(id) {
  return request({
    url: '/model/model/' + id,
    method: 'get'
  })
}

// 新增大模型配置
export function addModel(data) {
  return request({
    url: '/model/model',
    method: 'post',
    data: data
  })
}

// 修改大模型配置
export function updateModel(data) {
  return request({
    url: '/model/model',
    method: 'put',
    data: data
  })
}

// 删除大模型配置
export function delModel(id) {
  return request({
    url: '/model/model/' + id,
    method: 'delete'
  })
}
