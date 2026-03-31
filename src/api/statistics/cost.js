import request from '@/utils/request'

// 获取平台配置列表
export function getPlatformList(query) {
  return request({
    url: '/ai/cost/platform/list',
    method: 'get',
    params: query
  })
}

// 获取成本汇总
export function getCostSummary(startDate, endDate, platformType) {
  return request({
    url: '/ai/cost/summary',
    method: 'get',
    params: {
      startDate,
      endDate,
      platformType: platformType || 'ALL'
    }
  })
}

// 获取平台余额
export function getPlatformBalance() {
  return request({
    url: '/ai/cost/balance',
    method: 'get'
  })
}

// 获取消耗趋势
export function getCostTrend(startDate, endDate, granularity, platformCode) {
  return request({
    url: '/ai/cost/trend',
    method: 'get',
    params: {
      startDate,
      endDate,
      granularity: granularity || 'day',
      platformCode
    }
  })
}

// 获取平台分布
export function getCostDistribution(startDate, endDate, metricType) {
  return request({
    url: '/ai/cost/distribution',
    method: 'get',
    params: {
      startDate,
      endDate,
      metricType: metricType || 'token'
    }
  })
}

// 获取消耗明细
export function getCostList(query) {
  return request({
    url: '/ai/cost/list',
    method: 'get',
    params: query
  })
}

// 获取按日消耗明细
export function getCostDailyList(query) {
  return request({
    url: '/ai/cost/list/daily',
    method: 'get',
    params: query
  })
}

// 手动录入余额
export function manualInputBalance(data) {
  return request({
    url: '/ai/cost/balance/manual',
    method: 'post',
    data
  })
}

// 获取余额变化趋势
export function getBalanceTrend(startDate, endDate, granularity, platformCode) {
  return request({
    url: '/ai/cost/balance/trend',
    method: 'get',
    params: {
      startDate,
      endDate,
      granularity: granularity || 'day',
      platformCode
    }
  })
}

// 获取余额消耗统计
export function getBalanceConsumption(startDate, endDate) {
  return request({
    url: '/ai/cost/balance/consumption',
    method: 'get',
    params: {
      startDate,
      endDate
    }
  })
}

// 获取余额多周期对比
export function getBalanceCompare(baseDate) {
  return request({
    url: '/ai/cost/balance/compare',
    method: 'get',
    params: {
      baseDate
    }
  })
}

// 获取余额历史记录
export function getBalanceHistory(query) {
  return request({
    url: '/ai/cost/balance/history',
    method: 'get',
    params: query
  })
}

