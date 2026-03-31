import request from '@/utils/request'

// 查询VIEW列表
export function listSevicebag(query) {
  return request({
    url: '/system/sevicebag/list',
    method: 'get',
    params: query
  })
}

// 查询VIEW详细
export function getSevicebag(productType) {
  return request({
    url: '/system/sevicebag/' + productType,
    method: 'get'
  })
}

// 新增VIEW
export function addSevicebag(data) {
  return request({
    url: '/system/sevicebag',
    method: 'post',
    data: data
  })
}

// 修改VIEW
export function updateSevicebag(data) {
  return request({
    url: '/system/sevicebag',
    method: 'put',
    data: data
  })
}

// 删除VIEW
export function delSevicebag(productType) {
  return request({
    url: '/system/sevicebag/' + productType,
    method: 'delete'
  })
}

// 导出补充包订单
export function exportSevicebag(query) {
  return request({
    url: '/system/sevicebag/export',
    method: 'post',
    params: query,
    responseType: 'blob'
  })
}

// 补充包订单申请退款（微信/支付宝全额，标记退款中等待异步确认）
export function applyRefundSevicebag(data) {
  return request({
    url: '/system/sevicebag/refund/apply',
    method: 'post',
    data: data
  })
}
