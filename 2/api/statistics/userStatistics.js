import request from '@/utils/request'

// 获取用户统计概览数据（包含累计、本月、昨日用户数）
export function getOverview() {
  return request({
    url: '/system/userStatistics/overview',
    method: 'get'
  })
}

// 获取国家分布
export function getUserCountryDistribution(type) {
  return request({
    url: '/system/userStatistics/countryDistribution',
    method: 'get',
    params: { type }
  })
}

// 获取所有图表数据
export function getChartData(params) {
  return request({
    url: '/system/userStatistics/chartData',
    method: 'get',
    params
  })
}

// 获取图表详情
export function getChartDetail(type) {
  return request({
    url: '/system/userStatistics/chartDetail',
    method: 'get',
    params: { type }
  })
}
