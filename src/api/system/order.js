import request from '@/utils/request'

// 查询用户购买记录列表
export function listOrder(query) {
  return request({
    url: '/system/order/list',
    method: 'get',
    params: query
  })
}

// 查询用户购买记录详细
export function getOrder(id) {
  return request({
    url: '/system/order/' + id,
    method: 'get'
  })
}

// 新增用户购买记录
export function addOrder(data) {
  return request({
    url: '/system/order',
    method: 'post',
    data: data
  })
}

// 修改用户购买记录
export function updateOrder(data) {
  return request({
    url: '/system/order',
    method: 'put',
    data: data
  })
}

// 删除用户购买记录
export function delOrder(id) {
  return request({
    url: '/system/order/' + id,
    method: 'delete'
  })
}

// 激活订单对应用户权限
export function sendPermission(data) {
  return request({
    url: '/system/order/sendPermission' ,
    method: 'post',
    data: data
  })
}

// 取消订单对应用户权限
export function cancelPermission(data) {
  return request({
    url: '/system/order/cancelPermission' ,
    method: 'post',
    data: data
  })
}





