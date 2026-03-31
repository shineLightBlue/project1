import request from '@/utils/request'

// 查询App在线用户列表
export function list(query) {
  return request({
    url: '/monitor/appOnline/list',
    method: 'get',
    params: query
  })
}

// 查询指定用户的设备列表
export function devices(userId) {
  return request({
    url: '/monitor/appOnline/devices/' + userId,
    method: 'get'
  })
}

// 强退App用户指定设备
export function forceLogout(tokenId) {
  return request({
    url: '/monitor/appOnline/' + tokenId,
    method: 'delete'
  })
}

// 强退App用户所有设备
export function forceLogoutAll(userId) {
  return request({
    url: '/monitor/appOnline/forceLogoutAll/' + userId,
    method: 'delete'
  })
}

// 初始化在线用户索引
export function initIndex() {
  return request({
    url: '/monitor/appOnline/initIndex',
    method: 'post'
  })
}

