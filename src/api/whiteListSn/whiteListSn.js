import request from '@/utils/request'

// 查询whiteListSn列表
export function listWhiteListSn(query) {
  return request({
    url: '/whiteListSn/whiteListSn/list',
    method: 'get',
    params: query
  })
}

// 查询whiteListSn详细
export function getWhiteListSn(id) {
  return request({
    url: '/whiteListSn/whiteListSn/' + id,
    method: 'get'
  })
}

// 新增whiteListSn
export function addWhiteListSn(data) {
  return request({
    url: '/whiteListSn/whiteListSn',
    method: 'post',
    data: data
  })
}

// 修改whiteListSn
export function updateWhiteListSn(data) {
  return request({
    url: '/whiteListSn/whiteListSn',
    method: 'put',
    data: data
  })
}

// 删除whiteListSn
export function delWhiteListSn(id) {
  return request({
    url: '/whiteListSn/whiteListSn/' + id,
    method: 'delete'
  })
}
