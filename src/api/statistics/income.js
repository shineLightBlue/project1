import request from '@/utils/request'

// 获取昨日总收入
export function getYesterdayIncome(targetCurrency, exchangeRates) {
  return request({
    url: '/statistics/income/yesterday',
    method: 'post',
    data: {
      targetCurrency: targetCurrency,
      exchangeRates: exchangeRates
    }
  })
}

// 获取当月累计收入
export function getMonthIncome(targetCurrency, exchangeRates) {
  return request({
    url: '/statistics/income/month',
    method: 'post',
    data: {
      targetCurrency: targetCurrency,
      exchangeRates: exchangeRates
    }
  })
}

// 获取总收入
export function getTotalIncome(targetCurrency, exchangeRates) {
  return request({
    url: '/statistics/income/total',
    method: 'post',
    data: {
      targetCurrency: targetCurrency,
      exchangeRates: exchangeRates
    }
  })
}

// 根据类型和货币获取国家收入明细
export function getIncomeByCountry(type, currency) {
  return request({
    url: '/statistics/income/byCountry',
    method: 'get',
    params: {
      type: type,
      currency: currency
    }
  })
}

// 获取所有货币类型
export function getAllCurrencies() {
  return request({
    url: '/statistics/income/currencies',
    method: 'get'
  })
}

// 获取所有国家列表
export function getAllCountries() {
  return request({
    url: '/statistics/income/countries',
    method: 'get'
  })
}

// 根据类型、目标货币和汇率配置获取国家收入明细
export function getIncomeByCountryWithRates(type, targetCurrency, exchangeRates) {
  return request({
    url: '/statistics/income/byCountryWithRates',
    method: 'post',
    data: {
      type: type,
      targetCurrency: targetCurrency,
      exchangeRates: exchangeRates
    }
  })
}

// 获取收入构成比
export function getIncomeComposition(startDate, endDate, targetCurrency, exchangeRates, countries) {
  return request({
    url: '/statistics/income/composition',
    method: 'post',
    data: {
      startDate: startDate,
      endDate: endDate,
      targetCurrency: targetCurrency,
      exchangeRates: exchangeRates,
      countries: countries
    }
  })
}

// 获取付费用户数（按日期）
export function getPayingUserCountByDate(startDate, endDate, periodType, countries) {
  return request({
    url: '/statistics/income/payingUsers',
    method: 'post',
    data: {
      startDate: startDate,
      endDate: endDate,
      periodType: periodType || 'day',
      countries: countries
    }
  })
}

// 获取付费用户数（按国家）
export function getPayingUserCountByCountry(startDate, endDate, countries) {
  return request({
    url: '/statistics/income/payingUsersByCountry',
    method: 'post',
    data: {
      startDate: startDate,
      endDate: endDate,
      countries: countries
    }
  })
}

// 获取付费用户数（按日期和国家）
export function getPayingUserCountByDateAndCountry(startDate, endDate, periodType, countries) {
  return request({
    url: '/statistics/income/payingUsersByDateAndCountry',
    method: 'post',
    data: {
      startDate: startDate,
      endDate: endDate,
      periodType: periodType || 'day',
      countries: countries
    }
  })
}

// 获取会员订阅收入分布
export function getSubscriptionIncomeDistribution(startDate, endDate, targetCurrency, exchangeRates, countries) {
  return request({
    url: '/statistics/income/subscriptionDistribution',
    method: 'post',
    data: {
      startDate: startDate,
      endDate: endDate,
      targetCurrency: targetCurrency,
      exchangeRates: exchangeRates,
      countries: countries
    }
  })
}

// 获取会员订阅收入分布（按国家）
export function getSubscriptionIncomeDistributionByCountry(startDate, endDate, targetCurrency, exchangeRates, countries) {
  return request({
    url: '/statistics/income/subscriptionDistributionByCountry',
    method: 'post',
    data: {
      startDate: startDate,
      endDate: endDate,
      targetCurrency: targetCurrency,
      exchangeRates: exchangeRates,
      countries: countries
    }
  })
}

// 获取转写补充包收入分布
export function getSupplementPackageIncomeDistribution(startDate, endDate, targetCurrency, exchangeRates, countries) {
  return request({
    url: '/statistics/income/supplementDistribution',
    method: 'post',
    data: {
      startDate: startDate,
      endDate: endDate,
      targetCurrency: targetCurrency,
      exchangeRates: exchangeRates,
      countries: countries
    }
  })
}

// 获取转写补充包收入分布（按国家）
export function getSupplementPackageIncomeDistributionByCountry(startDate, endDate, targetCurrency, exchangeRates, countries) {
  return request({
    url: '/statistics/income/supplementDistributionByCountry',
    method: 'post',
    data: {
      startDate: startDate,
      endDate: endDate,
      targetCurrency: targetCurrency,
      exchangeRates: exchangeRates,
      countries: countries
    }
  })
}

// 获取总收入趋势
export function getTotalIncomeTrend(startDate, endDate, targetCurrency, exchangeRates, countries) {
  return request({
    url: '/statistics/income/trend',
    method: 'post',
    data: {
      startDate: startDate,
      endDate: endDate,
      targetCurrency: targetCurrency,
      exchangeRates: exchangeRates,
      countries: countries
    }
  })
}

// 获取总收入趋势（按国家）
export function getTotalIncomeTrendByCountry(startDate, endDate, targetCurrency, exchangeRates, countries) {
  return request({
    url: '/statistics/income/trendByCountry',
    method: 'post',
    data: {
      startDate: startDate,
      endDate: endDate,
      targetCurrency: targetCurrency,
      exchangeRates: exchangeRates,
      countries: countries
    }
  })
}

// 获取新老付费用户收入贡献
export function getNewOldUserIncomeContribution(startDate, endDate, targetCurrency, exchangeRates, countries) {
  return request({
    url: '/statistics/income/newOldUserContribution',
    method: 'post',
    data: {
      startDate: startDate,
      endDate: endDate,
      targetCurrency: targetCurrency,
      exchangeRates: exchangeRates,
      countries: countries
    }
  })
}

// 获取会员等级收入分布
export function getMemberLevelIncomeDistribution(startDate, endDate, periodType, targetCurrency, exchangeRates, countries) {
  return request({
    url: '/statistics/income/memberLevelDistribution',
    method: 'post',
    data: {
      startDate: startDate,
      endDate: endDate,
      periodType: periodType,
      targetCurrency: targetCurrency,
      exchangeRates: exchangeRates,
      countries: countries
    }
  })
}

// 获取收入明细列表
export function getIncomeDetailList(startDate, endDate, targetCurrency, exchangeRates, countries) {
  return request({
    url: '/statistics/income/incomeDetailList',
    method: 'post',
    data: {
      startDate: startDate,
      endDate: endDate,
      targetCurrency: targetCurrency,
      exchangeRates: exchangeRates,
      countries: countries
    }
  })
}

// 导出收入明细列表
export function exportIncomeDetailList(startDate, endDate, targetCurrency, exchangeRates, countries) {
  return request({
    url: '/statistics/income/exportIncomeDetailList',
    method: 'post',
    data: {
      startDate: startDate,
      endDate: endDate,
      targetCurrency: targetCurrency,
      exchangeRates: exchangeRates,
      countries: countries
    },
    responseType: 'blob'
  })
}
