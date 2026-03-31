import request from '@/utils/request'

// 查询productSn列表
export function listProductSn(query) {
  return request({
    url: '/productSn/productSn/list',
    method: 'get',
    params: query
  })
}

// 查询productSn详细
export function getProductSn(id) {
  return request({
    url: '/productSn/productSn/' + id,
    method: 'get'
  })
}

// 新增productSn
export function addProductSn(data) {
  return request({
    url: '/productSn/productSn',
    method: 'post',
    data: data
  })
}

// 修改productSn
export function updateProductSn(data) {
  return request({
    url: '/productSn/productSn',
    method: 'put',
    data: data
  })
}

// 删除productSn
export function delProductSn(id) {
  return request({
    url: '/productSn/productSn/' + id,
    method: 'delete'
  })
}

export function listProduct() {
  return request({
    url: '/system/product/productName/list',  // 替换成你后台产品列表接口
    method: 'get'
  })
}
