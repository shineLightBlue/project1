import request from '@/utils/request'

// 查询MesSn列表
export function listSn(query) {
  return request({
    url: '/MesSn/sn/list',
    method: 'get',
    params: query
  })
}

// 查询MesSn详细
export function getSn(id) {
  return request({
    url: '/MesSn/sn/' + id,
    method: 'get'
  })
}

// 新增MesSn
export function addSn(data) {
  return request({
    url: '/MesSn/sn',
    method: 'post',
    data: data
  })
}

// 修改MesSn
export function updateSn(data) {
  return request({
    url: '/MesSn/sn',
    method: 'put',
    data: data
  })
}

// 删除MesSn
export function delSn(id) {
  return request({
    url: '/MesSn/sn/' + id,
    method: 'delete'
  })
}
