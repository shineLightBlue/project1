import request from '@/utils/request'

// 创建 Checkout Session（Stripe Checkout 方案）- 后台管理接口
export function createCheckoutSession(data) {
  return request({
    url: '/system/stripe/create-checkout-session',
    method: 'post',
    data: data
  })
}

// 查询 Checkout Session 状态 - 后台管理接口
export function getCheckoutSessionStatus(sessionId) {
  return request({
    url: '/system/stripe/checkout-session',
    method: 'get',
    params: { sessionId }
  })
}

