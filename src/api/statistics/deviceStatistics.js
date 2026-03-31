import request from '@/utils/request'

// 获取设备统计信息（昨日绑定、当前已绑定、累计绑定）
export function getDeviceStatistics(filter) {
  return request({
    url: '/product/statistics',
    method: 'get',
    params: filter
  })
}

// 按国家统计设备详情
// type: yesterday-昨日绑定，current-当前已绑定，total-累计绑定
export function getDeviceStatisticsByCountry(type, filter) {
  return request({
    url: '/product/statistics/detail',
    method: 'get',
    params: {
      type: type,
      ...filter
    }
  })
}

// 按设备型号统计当前已绑定设备
export function getDeviceModelStatistics(filter) {
  return request({
    url: '/product/statistics/model',
    method: 'get',
    params: filter
  })
}

// 按平台统计当前已绑定设备
export function getDevicePlatformStatistics(filter) {
  return request({
    url: '/product/statistics/platform',
    method: 'get',
    params: filter
  })
}

// 按日期统计设备绑定趋势
export function getDeviceTrendStatistics(filter) {
  return request({
    url: '/product/statistics/trend',
    method: 'get',
    params: filter
  })
}

// 按设备型号和国家统计（用于弹窗对比）
export function getDeviceModelCountryStatistics(filter) {
  return request({
    url: '/product/statistics/model/country',
    method: 'get',
    params: filter
  })
}

// 按国家和日期统计设备绑定趋势（用于趋势图弹窗）
export function getDeviceTrendByCountry(filter) {
  return request({
    url: '/product/statistics/trend/country',
    method: 'get',
    params: filter
  })
}

// 查询绑定设备明细列表
export function getDeviceDetailList(query) {
  return request({
    url: '/product/statistics/detail/list',
    method: 'get',
    params: query
  })
}

// 获取活跃设备趋势（写死数据）
export function getActiveDeviceTrend(periodType) {
  return request({
    url: '/product/statistics/active/trend',
    method: 'get',
    params: { periodType: periodType || 'month' }
  })
}
