import request from '@/utils/request'

// 查询qa列表
export function listQa(query) {
  return request({
    url: '/qa/qa/list',
    method: 'get',
    params: query
  })
}

// 查询qa详细
export function getQa(id) {
  return request({
    url: '/qa/qa/' + id,
    method: 'get'
  })
}

// 新增qa
export function addQa(data) {
  return request({
    url: '/qa/qa',
    method: 'post',
    data: data
  })
}

// 修改qa
export function updateQa(data) {
  return request({
    url: '/qa/qa',
    method: 'put',
    data: data
  })
}

// 删除qa
export function delQa(id) {
  return request({
    url: '/qa/qa/' + id,
    method: 'delete'
  })
}
