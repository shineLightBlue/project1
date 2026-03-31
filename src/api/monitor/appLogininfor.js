import request from '@/utils/request'

// 查询App登录日志列表
export function list(query) {
  return request({
    url: '/monitor/appLogininfor/list',
    method: 'get',
    params: query
  })
}

// 删除App登录日志
export function delAppLogininfor(infoId) {
  return request({
    url: '/monitor/appLogininfor/' + infoId,
    method: 'delete'
  })
}

// 清空App登录日志
export function cleanLogininfor() {
  return request({
    url: '/monitor/appLogininfor/clean',
    method: 'delete'
  })
}

