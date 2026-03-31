import request from '@/utils/request'

// 查询平台账单列表
export function listPayxBill(query) {
  return request({
    url: '/system/payxBill/list',
    method: 'get',
    params: query
  })
}

// 查询平台账单详细（根据账单号）
export function getPayxBill(billNo) {
  return request({
    url: '/system/payxBill/' + billNo,
    method: 'get'
  })
}

// 根据订单ID查询账单列表
export function getPayxBillByOrderId(orderId) {
  return request({
    url: '/system/payxBill/order/' + orderId,
    method: 'get'
  })
}

// 根据用户ID查询账单列表
export function getPayxBillByUserId(userId) {
  return request({
    url: '/system/payxBill/user/' + userId,
    method: 'get'
  })
}
