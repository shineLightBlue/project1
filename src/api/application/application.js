import request from '@/utils/request'

// 查询application列表
export function listApplication(query) {
  return request({
    url: '/application/application/list',
    method: 'get',
    params: query
  })
}

// 查询application详细
export function getApplication(id) {
  return request({
    url: '/application/application/' + id,
    method: 'get'
  })
}

// 新增application
export function addApplication(data) {
  return request({
    url: '/application/application',
    method: 'post',
    data: data
  })
}

// 修改application
export function updateApplication(data) {
  return request({
    url: '/application/application',
    method: 'put',
    data: data
  })
}

// 删除application
export function delApplication(id) {
  return request({
    url: '/application/application/' + id,
    method: 'delete'
  })
}
