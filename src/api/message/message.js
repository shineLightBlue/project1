import request from '@/utils/request'

// 查询message列表
export function listMessage(query) {
  return request({
    url: '/message/message/list',
    method: 'get',
    params: query
  })
}

// 查询message详细
export function getMessage(id) {
  return request({
    url: '/message/message/' + id,
    method: 'get'
  })
}

export function updateMessageStatus(data) {
  return request({
    url: '/message/message/changeStatus',
    method: 'post',
    data: data
  });
}

// 新增message
export function addMessage(data) {
  return request({
    url: '/message/message',
    method: 'post',
    data: data
  })
}

// 批量新增message
export function addMessageBatch(data) {
  return request({
    url: '/message/message/batch',
    method: 'post',
    data: data
  })
}

// 修改message
export function updateMessage(data) {
  return request({
    url: '/message/message',
    method: 'put',
    data: data
  })
}

// 批量保存message（自动判断新增或更新）
export function saveMessageBatch(data) {
  return request({
    url: '/message/message/save',
    method: 'post',
    data: data
  })
}

// 删除message
export function delMessage(id) {
  return request({
    url: '/message/message/' + id,
    method: 'delete'
  })
}
