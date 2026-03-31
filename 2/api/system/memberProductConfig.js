import request from '@/utils/request'

// 查询用户权益配置列表
export function listMemberProductConfig(query) {
  return request({
    url: '/system/memberproductconfig/list',
    method: 'get',
    params: query
  })
}

// 查询专属特权配置
export function getPrivilegeByProductType(productType) {
  return request({
    url: '/system/memberproductconfig/privilege/' + productType,
    method: 'get'
  })
}

// 保存专属特权配置
export function savePrivileges(data) {
  return request({
    url: '/system/memberproductconfig/privilege',
    method: 'post',
    data: data
  })
}

// ==================== 多国家价格配置接口 ====================

// 查询产品价格矩阵（Excel风格）
export function getPriceMatrix() {
  return request({
    url: '/system/memberproductconfig/price/matrix',
    method: 'get'
  })
}

// 查询单个产品的所有国家价格
export function getProductPrices(productId) {
  return request({
    url: '/system/memberproductconfig/price/' + productId,
    method: 'get'
  })
}

// 批量保存产品价格配置
export function batchSavePrices(data) {
  return request({
    url: '/system/memberproductconfig/price/batch',
    method: 'post',
    data: data
  })
}

// 更新单个价格配置
export function updatePrice(data) {
  return request({
    url: '/system/memberproductconfig/price',
    method: 'put',
    data: data
  })
}
