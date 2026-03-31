import request from '@/utils/request'

// 获取订阅产品列表
export function getSubscripeProductList(data) {
  return request({
    url: '/app/product/getSubscripeProductList',
    method: 'post',
    data: data
  })
}

// 获取服务包产品列表（包含云存储和录音转写）
export function getServiceBagList(data) {
  return request({
    url: '/app/product/getServiceBagList',
    method: 'post',
    data: data
  })
}

