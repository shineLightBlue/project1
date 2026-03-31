import request from '@/utils/request'

// 查询埋点数据列表
export function listTrackingData(query) {
  return request({
    url: '/system/trackingData/list',
    method: 'get',
    params: query
  })
}

// 查询埋点数据详细（根据ID）
export function getTrackingData(id) {
  return request({
    url: '/system/trackingData/' + id,
    method: 'get'
  })
}

// 导出埋点数据列表
export function exportTrackingData(query) {
  return request({
    url: '/system/trackingData/export',
    method: 'post',
    params: query
  })
}
