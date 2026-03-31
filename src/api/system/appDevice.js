import request from '@/utils/request'

// 查询App设备列表
export function list(query) {
  return request({
    url: '/system/appDevice/list',
    method: 'get',
    params: query
  })
}

// 修改App设备
export function updateDevice(data) {
  return request({
    url: '/system/appDevice',
    method: 'put',
    data: data
  })
}

// 删除App设备（使用业务标识userId+deviceId）
export function delDevice(userId, deviceId) {
  return request({
    url: '/system/appDevice/remove',
    method: 'post',
    data: {
      userId: userId,
      deviceId: deviceId
    }
  })
}

// 更新设备状态（禁用/启用）
export function changeStatus(userId, deviceId, status) {
  return request({
    url: '/system/appDevice/changeStatus',
    method: 'post',
    data: {
      userId: userId,
      deviceId: deviceId,
      status: status
    }
  })
}

// 踢下线设备
export function forceLogout(userId, deviceId) {
  return request({
    url: '/system/appDevice/forceLogout',
    method: 'post',
    data: {
      userId: userId,
      deviceId: deviceId
    }
  })
}

