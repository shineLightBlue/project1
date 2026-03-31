import request from '@/utils/request'

// 查询App操作日志列表
export function list(query) {
  return request({
    url: '/monitor/appOperLog/list',
    method: 'get',
    params: query
  })
}

// 查询App操作日志详细
export function getInfo(operId) {
  return request({
    url: '/monitor/appOperLog/' + operId,
    method: 'get'
  })
}

// 删除App操作日志
export function delAppOperLog(operId) {
  return request({
    url: '/monitor/appOperLog/' + operId,
    method: 'delete'
  })
}

// 清空App操作日志
export function cleanOperLog() {
  return request({
    url: '/monitor/appOperLog/clean',
    method: 'delete'
  })
}

