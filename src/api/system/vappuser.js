import request from '@/utils/request'

// 查询VIEW列表
export function listVappuser(query) {
  return request({
    url: '/system/vappuser/list',
    method: 'get',
    params: query
  })
}

// 查询VIEW详细
export function getVappuser(userId) {
  return request({
    url: '/system/vappuser/' + userId,
    method: 'get'
  })
}

// 新增VIEW
export function addVappuser(data) {
  return request({
    url: '/system/vappuser',
    method: 'post',
    data: data
  })
}

// 修改VIEW
export function updateVappuser(data) {
  return request({
    url: '/system/vappuser',
    method: 'put',
    data: data
  })
}

// 删除VIEW
export function delVappuser(userId) {
  return request({
    url: '/system/vappuser/' + userId,
    method: 'delete'
  })
}

// 获取用户权益列表
export function getUserInterests(userId) {
  return request({
    url: '/system/vappuser/' + userId + '/interests',
    method: 'get'
  })
}

// 注销APP用户
export function logOffVappuser(userId) {
  return request({
    url: '/system/vappuser/logoff/' + userId,
    method: 'post'
  })
}

// 获取用户绑定的设备列表
export function getUserDevices(userId, queryParams) {
  return request({
    url: '/system/vappuser/' + userId + '/devices',
    method: 'get',
    params: queryParams
  })
}

// 获取用户会员订阅订单列表
export function getUserSubscribeOrders(userId, queryParams) {
  return request({
    url: '/system/vappuser/' + userId + '/subscribe-orders',
    method: 'get',
    params: queryParams
  })
}

// 获取用户补充包订单列表
export function getUserBills(userId, queryParams) {
  return request({
    url: '/system/vappuser/' + userId + '/bills',
    method: 'get',
    params: queryParams
  })
}

// 获取用户录音文件列表
export function getUserAudioFiles(userId, queryParams) {
  return request({
    url: '/system/vappuser/' + userId + '/audio-files',
    method: 'get',
    params: queryParams
  })
}

// 获取用户转写明细记录列表
export function getUserTranscriptions(userId, queryParams) {
  return request({
    url: '/system/vappuser/' + userId + '/transcriptions',
    method: 'get',
    params: queryParams
  })
}

// 获取用户反馈数据列表
export function getUserFeedbacks(userId, queryParams) {
  return request({
    url: '/system/vappuser/' + userId + '/feedbacks',
    method: 'get',
    params: queryParams
  })
}

// 取消用户的Stripe订阅 - 后台管理接口（固定为立即取消）
export function cancelStripeSubscription(userId) {
  return request({
    url: '/system/stripe/cancel-subscription/' + userId,
    method: 'post'
  })
}
