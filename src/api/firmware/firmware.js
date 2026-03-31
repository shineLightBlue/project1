import request from '@/utils/request'

// 查询firmware列表
export function listFirmware(query) {
  return request({
    url: '/firmware/firmware/list',
    method: 'get',
    params: query
  })
}

// 查询firmware详细
export function getFirmware(id) {
  return request({
    url: '/firmware/firmware/' + id,
    method: 'get'
  })
}

// 新增firmware
export function addFirmware(data) {
  return request({
    url: '/firmware/firmware',
    method: 'post',
    data: data
  })
}

// 修改firmware
export function updateFirmware(data) {
  return request({
    url: '/firmware/firmware',
    method: 'put',
    data: data
  })
}

// 删除firmware
export function delFirmware(id) {
  return request({
    url: '/firmware/firmware/' + id,
    method: 'delete'
  })

}
export function changeSkipStatus(id) {
  return request({
    url: '/firmware/firmware/changeStatus',
    method: 'post',
    params: { id }
  })
}
export function listProduct() {
  return request({
    url: '/system/product/productName/list',  // 替换成你后台产品列表接口
    method: 'get'
  })
}
