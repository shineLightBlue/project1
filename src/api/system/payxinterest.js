import request from '@/utils/request'

// 查询用户权益列表
export function listPayxinterest(query) {
  return request({
    url: '/system/payxinterest/list',
    method: 'get',
    params: query
  })
}

// 查询用户权益详细（根据权益ID）
export function getPayxinterest(interestId) {
  return request({
    url: '/system/payxinterest/' + interestId,
    method: 'get'
  })
}

// 根据用户ID查询权益列表
export function getPayxinterestByUserId(userId) {
  return request({
    url: '/system/payxinterest/user/' + userId,
    method: 'get'
  })
}

// 查询用户某类权益的剩余总量
export function getRemainingValue(userId, category) {
  return request({
    url: '/system/payxinterest/remaining/' + userId + '/' + category,
    method: 'get'
  })
}

// 收回权益
export function revokePayxinterest(interestId) {
  return request({
    url: '/system/payxinterest/revoke/' + interestId,
    method: 'post'
  })
}

// 根据订单ID收回权益
export function revokePayxinterestByOrderId(orderId) {
  return request({
    url: '/system/payxinterest/revokeByOrder/' + orderId,
    method: 'post'
  })
}

// 手动发放权益
export function grantPayxinterest(data) {
  return request({
    url: '/system/payxinterest/grant',
    method: 'post',
    data: data
  })
}

// 获取用户权益详情（包含基本信息、消耗统计）
export function getUserInterestDetail(userId, params) {
  return request({
    url: '/system/payxinterest/userDetail/' + userId,
    method: 'get',
    params: params
  })
}