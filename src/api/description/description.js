import request from '@/utils/request'

// 查询description列表
export function listDescription(query) {
  return request({
    url: '/description/description/list',
    method: 'get',
    params: query
  })
}

// 查询description详细
export function getDescription(id) {
  return request({
    url: '/description/description/' + id,
    method: 'get'
  })
}

// 新增description
export function addDescription(data) {
  return request({
    url: '/description/description',
    method: 'post',
    data: data
  })
}

// 修改description
export function updateDescription(data) {
  return request({
    url: '/description/description',
    method: 'put',
    data: data
  })
}

// 删除description
export function delDescription(id) {
  return request({
    url: '/description/description/' + id,
    method: 'delete'
  })
}
