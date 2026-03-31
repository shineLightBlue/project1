import request from '@/utils/request'

// 获取用户总数
export function getUserCount() {
  return request({
    url: '/dashboard/user/count', // 根据实际接口路径修改
    method: 'get'
  })
}

// 获取订单总数
export function getOrderCount() {
  return request({
    url: '/dashboard/order/count', // 根据实际接口路径修改
    method: 'get'
  })
}

// 获取会员订阅订单总数
export function getSubscripeOrderCount() {
  return request({
    url: '/dashboard/subscripeOrder/count', // 根据实际接口路径修改
    method: 'get'
  })
}

// 获取补充包订单总数(服务包)
export function getSevercieOrderCount() {
  return request({
    url: '/dashboard/severcieOrder/count', // 根据实际接口路径修改
    method: 'get'
  })
}


// 获取今日访问量
export function getTodayVisitCount() {
  return request({
    url: '/dashboard/visit/today', // 根据实际接口路径修改
    method: 'get'
  })
}
