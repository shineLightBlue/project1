import request from '@/utils/request'

// 查询VIEW列表
export function listSubscribe(query) {
  return request({
    url: '/system/subscribe/list',
    method: 'get',
    params: query
  })
}

// 查询VIEW详细
export function getSubscribe(productType) {
  return request({
    url: '/system/subscribe/' + productType,
    method: 'get'
  })
}

// 新增VIEW
export function addSubscribe(data) {
  return request({
    url: '/system/subscribe',
    method: 'post',
    data: data
  })
}

// 修改VIEW
export function updateSubscribe(data) {
  return request({
    url: '/system/subscribe',
    method: 'put',
    data: data
  })
}

// 删除VIEW
export function delSubscribe(productType) {
  return request({
    url: '/system/subscribe/' + productType,
    method: 'delete'
  })
}

// 导出会员订阅订单
export function exportSubscribe(query) {
  return request({
    url: '/system/subscribe/export',
    method: 'post',
    params: query,
    responseType: 'blob'
  })
}

// 订阅订单申请退款（微信/支付宝全额，标记退款中等待异步确认）
export function applyRefundSubscribe(data) {
  return request({
    url: '/system/subscribe/refund/apply',
    method: 'post',
    data: data
  })
}
