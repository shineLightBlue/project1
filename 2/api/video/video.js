import request from '@/utils/request'

// 查询video列表
export function listVideo(query) {
  return request({
    url: '/video/video/list',
    method: 'get',
    params: query
  })
}

// 查询video详细
export function getVideo(id) {
  return request({
    url: '/video/video/' + id,
    method: 'get'
  })
}

// 新增video
export function addVideo(data) {
  return request({
    url: '/video/video',
    method: 'post',
    data: data
  })
}

// 修改video
export function updateVideo(data) {
  return request({
    url: '/video/video',
    method: 'put',
    data: data
  })
}

// 删除video
export function delVideo(id) {
  return request({
    url: '/video/video/' + id,
    method: 'delete'
  })
}
