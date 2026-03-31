import request from '@/utils/request'

// 查询绑定记录列表
export function listBindingRecord(query) {
  return request({
    url: '/product/selectBindList',
    method: 'get',
    params: query
  })
}

// 解除绑定
export function unBindDevice(data) {
  return request({
    url: '/product/unbind',
    method: 'post',
    data: data
  })
}

// 查询绑定记录列表
export function listMonitorRecord(query) {
  return request({
    url: '/device/rebind/log/list',
    method: 'get',
    params: query
  })
}

// 查询日志详细
export function getInfo(id) {
  return request({
    url: '/device/rebind/log/' + id,
    method: 'get'
  })
}

export function getBindInfo(sn){
   return request({
    url: '/product/selectBindList',
    method: 'get',
    params:{
      productSn:sn
    }
  })
}