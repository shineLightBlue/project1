import request from '@/utils/request'

// 查询用户权益流水列表
export function listPayxinterestRecord(query) {
  return request({
    url: '/system/payxinterestRecord/list',
    method: 'get',
    params: query
  })
}

// 查询用户权益流水详细（根据权益流水ID）
export function getPayxinterestRecord(recordId) {
  return request({
    url: '/system/payxinterestRecord/' + recordId,
    method: 'get'
  })
}

// 根据权益ID查询流水列表
export function getPayxinterestRecordByInterestId(interestId) {
  return request({
    url: '/system/payxinterestRecord/interest/' + interestId,
    method: 'get'
  })
}

// 根据用户ID查询流水列表
export function getPayxinterestRecordByUserId(userId) {
  return request({
    url: '/system/payxinterestRecord/user/' + userId,
    method: 'get'
  })
}

// 手动权益调整
export function manualAdjustInterest(data) {
  return request({
    url: '/system/payxinterestRecord/manualAdjust',
    method: 'post',
    data: data
  })
}

// 获取可冲正的权益流水列表
export function getReversibleRecords(userId) {
  return request({
    url: '/system/payxinterestRecord/reversible/' + userId,
    method: 'get'
  })
}

// 根据用户账号获取可冲正的权益流水列表（分页）
export function getReversibleRecordsByAccount(params) {
  return request({
    url: '/system/payxinterestRecord/reversibleByAccount',
    method: 'get',
    params: params
  })
}

// 更新权益流水备注
export function updateRemark(data) {
  return request({
    url: '/system/payxinterestRecord/updateRemark',
    method: 'post',
    data: data
  })
}
