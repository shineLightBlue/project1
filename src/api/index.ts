import instance from '@/api/instance.ts'

export * from '@/api/files.ts'

/**
 * 1.1 验证码发送接口
 */
export function apiSendCaptcha(data: Record<string, any>) {
  return instance.post('/api/sendCaptcha', { noLogin: true, ...data })
}

/**
 * 1.2 手机号,邮箱登录/注册
 */
export function apiLogin(data: Record<string, any>) {
  return instance.post('/app/login', { noLogin: true, ...data })
}

/**
 * 1.4 获取用户基本信息(包括会员录音转写,云存储权限)
 */
export function apiGetAppUserInfo(data: Record<string, any>) {
  return instance.post('/app/getAppUserInfo', data)
}

/**
 * 1.5 设置用户昵称
 */
export function apiUpdateAppUserNickName(data: { userId: string; nickName: string }) {
  return instance.post('/app/updateAppUserNickName', data)
}

/**
 * 1.7 设置用户头像
 */
export function apiSetUserHeadImg(data: FormData) {
  return instance.post('/app/userInfo/setUserHeadImg', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/**
 * 1.8 退出用户
 */
export const apiEscAppUser = (data = {}) => {
  return instance.post('/app/escAppUser', data)
}

/**
 * 1.9 变更邮箱发起
 */
export function updateUserEmailSend(data: { oldEmail: string; captcha: string }) {
  return instance.post('/app/userInfo/updateUserEmailSend', data)
}

/**
 * 1.10 变更邮箱确认
 */
export function updateUserEmailConfirm(data: { newEmail: string; captcha: string }) {
  return instance.post('/app/userInfo/updateUserEmailConfirm', data)
}

/**
 * 1.11 变更手机号发起
 */
export function updateUserPhoneNumberSend(data: { oldPhoneNumber: string; captcha: string }) {
  return instance.post('/app/userInfo/updateUserPhoneNumberSend', data)
}

/**
 * 1.12 变更手机号确认
 */
export function updateUserPhoneNumberConfirm(data: { newPhoneNumber: string; captcha: string }) {
  return instance.post('/app/userInfo/updateUserPhoneNumberConfirm', data)
}

/**
 * 1.15 用户意见反馈
 */
export function submitSuggestion(data: FormData) {
  return instance.post('/app/userInfo/userSuggestionSubmit', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/**
 * 1.20 忘记密码--重设密码
 */
export function apiResetPassword(data: Record<string, any>) {
  return instance.post('/app/forgetPwd/updatePwd', { noLogin: true, ...data })
}

/**
 * 1.22 校验忘记密码的验证码
 */
export const apiCheckForgotCaptcha = (data: Record<string, any>) => {
  return instance.post('/app/forgetPwd/captchChceck', { noLogin: true, ...data })
}

/**
 * 刷新 access token（session 过期时由 instance 拦截器自动调用）
 */
export function apiRefreshToken(data: { token: string; refreshToken: string }) {
  return instance.post('/app/refreshToken', { noLogin: true, ...data })
}

/**
 * 1.24 获取用户国家
 */
export function apiGetUserCountry() {
  return instance.get('/app/getUserCountry')
}

/**
 * 1.27 获取当前登录的设备列表
 */
export function apiGetLoginDevices() {
  return instance.post('/app/getLoginDevices')
}

/**
 * 1.28 踢出设备
 */

export const apiKickOffDevice = (data: { tokenId: string }) => {
  return instance.post('/app/kickOffDevice', data)
}

/**
 * 2.10 获取用户所有文件及文件夹下文件
 */
export function apiCloudList(data: Record<string, any>) {
  return instance.post('/api/cloud/list', data)
}

/**
 * 2.11 云存储 STS 临时凭证
 */
export function apiCloudStsToken(data: Record<string, any>) {
  return instance.post('/api/cloud/sts/token', data)
}

export function apiCloudFileSave(data: Record<string, any>) {
  return instance.post('/api/cloud/file/save', data)
}

/**
 * 按用户查询当前订阅（会员中心/设置-会员页用于展示当前套餐、到期日、用量等）
 * @param data 需包含 userId、availablePlatform 等
 */
export function apiQuerySubscripeByUserId(data: Record<string, any>) {
  return instance.post('/app/memberInfo/querySubscripeByUserId', data)
}

/**
 * 获取订阅商品列表（月付/年付套餐及加购包），会员中心套餐卡与加购卡数据来源
 * @param data 需包含 productBuyPlatform、appVersion、availablePlatform 等
 */
export function apiGetSubscripeProductList(data: Record<string, any>) {
  return instance.post('/app/product/getSubscripeProductList', data)
}

/**
 * 创建 Stripe 收银台会话；成功后跳转返回的 url 完成支付
 * @param data 需包含 userId、productId、isAboardFlag、successUrl、cancelUrl
 */
export function apiCreateStripeCheckoutSession(data: Record<string, any>) {
  return instance.post('/pay/stripe/web/create-checkout-session', data)
}

/**
 * 查询 Stripe Checkout Session 状态（支付成功页用于确认支付结果）
 */
export function apiGetStripeCheckoutSession(params: { sessionId: string }, showError = true) {
  return instance.get('/pay/stripe/web/checkout-session', { params, showError })
}

/**
 * 获取按套餐档位分组的权益列表（key 1=专业版 2=探索版 3=大师版），会员中心与支付成功页权益展示用
 */
export function apiGetProductPrivileges(data: Record<string, any> = {}) {
  return instance.post('/app/product/getProductPrivileges', data)
}

/**
 * 获取用户绑定设备列表（未绑定任何设备时返回空数组）
 */
export function apiGetUserBindDeviceList(data: { userId: string }) {
  return instance.post('/api/product/bind/list', data)
}

/**
 * 查询购买记录（分页）
 */
export function apiQueryBuyLogByUserId(data: {
  userId: string
  pageNum?: number
  pageSize?: number
}) {
  return instance.post('/app/memberInfo/queryBuyLogByUserId', {
    pageNum: data.pageNum ?? 1,
    pageSize: data.pageSize ?? 10,
    ...data,
  })
}

/**
 * 查询转写消耗记录（分页）
 */
export function apiQueryRecordLogByUserId(data: {
  userId: string
  pageNum?: number
  pageSize?: number
  isAboard?: string
}) {
  return instance.post('/app/memberInfo/queryRecordLogByUserId', {
    pageNum: data.pageNum ?? 1,
    pageSize: data.pageSize ?? 10,
    ...data,
  })
}

/**
 * 2.3 获取用户所有文件夹
 * @param data
 */
export function apiCloudFolderList(data: Record<string, any> = {}) {
  return instance.post('/api/cloud/folder/list', data)
}

/**
 * 取消 Stripe 订阅
 */
export function apiCancelStripeSubscription(data: Record<string, any>) {
  return instance.post('/pay/stripe/web/cancel-subscription', data)
}

/**
 * 1.3 APP三方登录/注册(微信,谷歌,苹果)
 */
export function apiAppThirdLogin(data: Record<string, any>) {
  return instance.post('/app/thirdLogin', data)
}


/**
 * 1.18 绑定第三方登录(微信,谷歌,苹果)
 */
export function apiBindThirdAccount(data: Record<string, any>, config?: any) {
  return instance.post('/app/bindThirdAccount', data, config)
}

/**
 * 1.19 解绑第三方登录(微信,谷歌,苹果)
 */
export function apiUnbindThirdAccount(data: Record<string, any>) {
  return instance.post('/app/unBindThirdAccount', data)
}
