<template>
  <section class="settings-placeholder">
    <div class="account-security">
      <!-- 登录方式 -->
      <section class="security-section">
        <h3 class="section-title">{{ $t('layout.settings.accountSafety.loginMethods.title') }}</h3>
        <ul class="method-list">
          <!-- 更改手机号/邮箱 -->
          <li class="method-item" @click="handleShowConfirm">
            <div class="method-info1">
              <img
                v-if="userCountry === '中国'"
                src="@/assets/images/icon_phone_number.svg"
                class="menu-svg"
              />
              <img v-else src="@/assets/images/icon_email.svg" class="menu-svg" />
              <span class="method-name">{{
                userCountry === '中国'
                  ? $t('layout.settings.accountSafety.loginMethods.phone')
                  : $t('layout.settings.accountSafety.loginMethods.email')
              }}</span>
            </div>
            <div class="method-extra">{{ displayAccount }}</div>
            <img src="@/assets/images/icon_next.svg" class="next-svg" />
          </li>
          <!-- 更改密码 -->
          <li class="method-item" @click="handleChangePassword">
            <div class="method-info">
              <img src="@/assets/images/icon_change_password.svg" class="menu-svg" />
              <span class="method-name">{{
                $t('layout.settings.accountSafety.loginMethods.changePassword')
              }}</span>
            </div>
            <!-- 忘记密码 -->
            <span class="forgot-link" @click.stop="handleForgotPassword"></span>
            <img src="@/assets/images/icon_next.svg" class="next-svg" />
          </li>
          <!-- Google -->
          <li class="method-item">
            <div class="method-info">
              <img src="@/assets/images/icon_google.svg" class="menu-svg" />
              <span class="method-name">{{
                $t('layout.settings.accountSafety.loginMethods.thirdAccountTypes.google')
              }}</span>
            </div>
            <div class="method-action">
              <button
                v-if="!googleId"
                class="btn-add"
                @click="bindGoogle"
              >
                {{ $t('layout.settings.accountSafety.loginMethods.add') }}
              </button>
              <button
                v-else
                class="btn-remove"
                @click="unbindGoogle"
              >
                {{ $t('layout.settings.accountSafety.loginMethods.remove') }}
              </button>
            </div>
          </li>
          <!-- Apple -->
          <li class="method-item">
            <div class="method-info">
              <img src="@/assets/images/icon_apple.svg" class="menu-svg" />
              <span class="method-name">{{
                $t('layout.settings.accountSafety.loginMethods.thirdAccountTypes.apple')
              }}</span>
            </div>
            <div class="method-action">
              <button
                v-if="!appleId"
                class="btn-add"
                @click="bindApple"
              >
                {{ $t('layout.settings.accountSafety.loginMethods.add') }}
              </button>
              <button
                v-else
                class="btn-remove"
                @click="unbindApple"
              >
                {{ $t('layout.settings.accountSafety.loginMethods.remove') }}
              </button>
            </div>
          </li>
          <!-- 微信 -->
          <li class="method-item">
            <div class="method-info">
              <img src="@/assets/images/icon_wechat.svg" class="menu-svg" />
              <span class="method-name">{{
                $t('layout.settings.accountSafety.loginMethods.thirdAccountTypes.wechat')
              }}</span>
            </div>
            <div class="method-action">
              <button
                v-if="!wechatId"
                class="btn-add"
                @click="bindWechat"
              >
                {{ $t('layout.settings.accountSafety.loginMethods.add') }}
              </button>
              <button
                v-else
                class="btn-remove"
                @click="unbindWechat"
              >
                {{ $t('layout.settings.accountSafety.loginMethods.remove') }}
              </button>
            </div>
          </li>
        </ul>
      </section>

      <!-- 登录设备 -->
      <section class="security-section">
        <h3 class="section-title">{{ $t('layout.settings.accountSafety.devices.title') }}</h3>
        <div class="device-table">
          <div class="table-header">
            <span class="col-device">{{ $t('layout.settings.accountSafety.devices.device') }}</span>
            <span class="col-login">{{ $t('layout.settings.accountSafety.devices.loginMethod') }}</span>
            <span class="col-time">{{ $t('layout.settings.accountSafety.devices.lastActiveTime') }}</span>
            <span class="col-action">{{ $t('layout.settings.accountSafety.devices.operation') }}</span>
          </div>
          <div class="device-rows">
            <template v-if="devices.length > 0">
              <div
                v-for="device in devices"
                :key="device.deviceId || device.tokenId"
                class="table-row"
              >
                <span class="col-device">
                  {{ deviceDisplayName(device) }}
                  <span v-if="device.isCurrent" class="device-badge current">{{
                    $t('layout.settings.accountSafety.devices.currentDevice')
                  }}</span>
                  <span v-if="!device.isCurrent && device.isOnline" class="device-badge online">{{
                    $t('layout.settings.accountSafety.devices.loggedIn')
                  }}</span>
                </span>
                <span class="col-login">{{ getLoginMethod(device) }}</span>
                <span class="col-time">{{ formatTime(device.lastLoginTime) }}</span>
                <button class="btn-delete" @click="handleDelete(device)">
                  {{ $t('layout.settings.accountSafety.devices.delete') }}
                </button>
              </div>
            </template>
            <div v-else class="empty-devices">
              {{ $t('layout.settings.accountSafety.devices.noDevices') }}
            </div>
          </div>
        </div>

        <!-- 退出登录 -->
        <div class="logout-wrapper">
          <button class="btn-logout" @click="showLogoutDialog = true">
            {{ $t('layout.settings.accountSafety.logout') }}
          </button>
        </div>
      </section>
    </div>

    <!-- 确认变更弹窗 -->
    <div v-if="showConfirmDialog" class="dialog-overlay" >
      <div class="confirm-dialog">
        <h3 class="dialog-title">{{ $t('layout.settings.accountSafety.changeEmail.confirmTitle') }}</h3>
        <p class="confirm-question">
          {{
            changeType === 'phone'
              ? $t('layout.settings.accountSafety.changePhone.confirmQuestion')
              : $t('layout.settings.accountSafety.changeEmail.confirmQuestion')
          }}
        </p>
        <p class="current-account">
          {{
            changeType === 'phone'
              ? $t('layout.settings.accountSafety.changePhone.currentPhone', { phone: currentAccount })
              : $t('layout.settings.accountSafety.changeEmail.currentEmail', { email: currentAccount })
          }}
        </p>
        <div class="dialog-actions">
          <button class="btn-cancel" @click="showConfirmDialog = false">
            {{ $t('common.cancel') }}
          </button>
          <button class="btn-confirm" @click="handleConfirmChange">
            {{ $t('layout.settings.accountSafety.changePhone.change') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 修改手机号/邮箱弹窗 -->
    <ChangeAccountDialog
      v-model:visible="showChangeDialog"
      :type="changeType"
      :current-account="currentAccount"
      @success="handleUpdateSuccess"
    />

    <!-- 退出登录确认弹窗 -->
    <LogoutConfirmDialog v-model:visible="showLogoutDialog" @confirm="handleLogout" />

    <!-- 解绑第三方账号确认弹窗 -->
    <UnbindConfirmDialog
      v-model:visible="unbindDialogVisible"
      :account-type="unbindType"
      @confirm="handleUnbindConfirm"
    />

    <!-- 唯一绑定警告弹窗 -->
    <div v-if="showOnlyOneWarning" class="dialog-overlay">
      <div class="confirm-dialog">
        <div style="display:flex;">
          <h3 class="dialog-title">{{ $t('layout.settings.accountSafety.changeEmail.confirmTitle') }}</h3>
          <img class="cancel" src="@/assets/images/icon_cancel.svg" @click="handleForceUnbind"/>
        </div>
        <p class="confirm-question">
          {{ $t('layout.settings.accountSafety.loginMethods.loginMethodWarning') }}
        </p>
        <div class="dialog-actions">
          <button class="btn-confirm" @click="handleForceUnbind">确定</button>
        </div>
      </div>
    </div>

    <!-- 绑定失败固定弹窗 -->
    <div v-if="bindErrorVisible" class="dialog-overlay">
      <div class="confirm-dialog">
        <h3 class="dialog-title">{{ $t('layout.settings.accountSafety.loginMethods.alreadyRegistered') }}</h3>
        <p class="confirm-question">
          {{ $t('layout.settings.accountSafety.loginMethods.Registered') }}
        </p>
        <div class="dialog-actions">
          <button class="btn-confirm" @click="bindErrorVisible = false">
            {{ $t('common.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { apiGetUserCountry, apiGetAppUserInfo, apiGetLoginDevices, apiKickOffDevice,
         apiEscAppUser, apiUnbindThirdAccount } from '@/api/index.ts'
import ChangeAccountDialog from '@/components/ChangeAccountDialog.vue'
import LogoutConfirmDialog from '@/components/LogoutConfirmDialog.vue'
import UnbindConfirmDialog from '@/components/UnbindConfirmDialog.vue'
import { useThirdLogin } from '@/views/login/thirdLogin.js'
import { ElMessage } from 'element-plus'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

// 第三方登录 
const { googleInit, googleLogin, wechatLogin, appleLogin } = useThirdLogin()

// 用户信息
const userCountry = ref<string>('')
const userPhone = ref<string>('')
const userEmail = ref<string>('')
const wechatId = ref<string | null>(null)
const googleId = ref<string | null>(null)
const appleId = ref<string | null>(null)

// 设备列表
interface Device {
  deviceName: string | null
  browser: string
  platform: number | null
  lastLoginTime: string
  isCurrent: boolean
  isOnline?: boolean
  deviceId?: string
  tokenId: string
  [key: string]: any
}
const devices = ref<Device[]>([])

// 弹窗控制
const showConfirmDialog = ref(false)
const showChangeDialog = ref(false)
const showLogoutDialog = ref(false)
const unbindDialogVisible = ref(false)
const showOnlyOneWarning = ref(false)
const unbindType = ref<'wechat' | 'google' | 'apple'>('wechat')

// 绑定错误弹窗
const bindErrorVisible = ref(false)

// 解绑错误弹窗
const unbindErrorVisible = ref(false)
const unbindErrorMessage = ref('')

const changeType = computed<'phone' | 'email'>(() =>
  userCountry.value === '中国' ? 'phone' : 'email'
)
const currentAccount = computed(() =>
  changeType.value === 'phone' ? userPhone.value : userEmail.value
)
const displayAccount = computed(() => {
  return userCountry.value === '中国' ? userPhone.value : userEmail.value
})
const unbindTypeName = computed(() => {
  const key = `layout.settings.accountSafety.loginMethods.thirdAccountTypes.${unbindType.value}`
  return t(key)
})

// 更改密码
const handleChangePassword = () => {
  router.push({
    path: '/reset-password',
    query: { returnUrl: '/settings/account-security' }
  })
}

// 第三方账号绑定
const bindWechat = async () => {
  try {
    await wechatLogin(false)
  } catch (error) {
    bindErrorVisible.value = true
  }
}
const bindGoogle = async () => {
  try {
    await googleLogin(false)
  } catch (error) {
    bindErrorVisible.value = true
  }
}
const bindApple = async () => {
  try {
    await appleLogin(false)
  } catch (error) {
    bindErrorVisible.value = true
  }
}

// 解绑
const unbindWechat = () => {
  unbindType.value = 'wechat'
  unbindDialogVisible.value = true
}
const unbindGoogle = () => {
  unbindType.value = 'google'
  unbindDialogVisible.value = true
}
const unbindApple = () => {
  unbindType.value = 'apple'
  unbindDialogVisible.value = true
}

// 确认解绑前的检查
const handleUnbindConfirm = async () => {
  const otherBound = {
    wechat: wechatId.value && unbindType.value !== 'wechat',
    google: googleId.value && unbindType.value !== 'google',
    apple: appleId.value && unbindType.value !== 'apple'
  }
  const hasOther = otherBound.wechat || otherBound.google || otherBound.apple

  if (!hasOther) {
    showOnlyOneWarning.value = true
    return
  }
  await doUnbind()
}

// 解绑
const doUnbind = async () => {
  try {
    let thirdAccountId = ''
    if (unbindType.value === 'wechat') thirdAccountId = wechatId.value || ''
    else if (unbindType.value === 'google') thirdAccountId = googleId.value || ''
    else if (unbindType.value === 'apple') thirdAccountId = appleId.value || ''

    if (!thirdAccountId) return

    const res = await apiUnbindThirdAccount({
      thirdAccountType: unbindType.value,
      thirdAccountId
    })

    if (res.code === 200) {
      await fetchUserInfo()
      unbindDialogVisible.value = false
      ElMessage.success(t('layout.settings.accountSafety.unbindThirdAccountSuccess', {
        type: unbindTypeName.value
      }))
    } else {
      unbindErrorMessage.value = res.msg || t('layout.settings.accountSafety.unbindThirdAccountError.failed')
      unbindErrorVisible.value = true
    }
  } catch (error) {
    unbindErrorMessage.value = t('auth.errors.networkError')
    unbindErrorVisible.value = true
  }
}

const handleForceUnbind = async () => {
  showOnlyOneWarning.value = false
}

// 格式化时间
const formatTime = (timeStr: string) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

const deviceDisplayName = (device: Device) => {
  return device.deviceName || device.browser ||  t('layout.settings.accountSafety.devices.unknownDevice')
}

const getLoginMethod = (device: Device): string => {
  if (device.platform !== undefined && device.platform !== null) {
    switch (device.platform) {
      case '0' || 'iOS':
        return 'iOS'
      case '1' || 'Android':
        return 'Android'
      case '2' || 'Web':
        return 'Web'
      case '3' || '微信小程序':
        return '微信小程序'
      case '4' || '其他':
        return '其他'
      default:
        break
    }
  }
  if (device.browser) {
    return device.browser
  }
  return t('layout.settings.accountSafety.devices.unknown')
}

// 获取设备列表
const fetchDevices = async () => {
  try {
    const devicesRes = await apiGetLoginDevices()
    if (devicesRes.data && devicesRes.data.devices) {
      const deviceList = devicesRes.data.devices
      deviceList.sort((a, b) => {
        if (a.isCurrent && !b.isCurrent) return -1
        if (!a.isCurrent && b.isCurrent) return 1
        const timeA = a.lastLoginTime ? new Date(a.lastLoginTime).getTime() : 0
        const timeB = b.lastLoginTime ? new Date(b.lastLoginTime).getTime() : 0
        return timeB - timeA
      })
      devices.value = deviceList
    }
  } catch (error) {
    console.error('获取设备列表失败', error)
  }
}

// 删除设备
const handleDelete = async (device: Device) => {
  if (!device.tokenId) return
  try {
    const res = await apiKickOffDevice({ tokenId: device.tokenId })
    if (res.code === 200) {
      await fetchDevices()
    } else {
      alert(t('layout.settings.accountSafety.devices.deleteFailed'))
    }
  } catch (error) {
    console.error('踢出设备失败', error)
    alert(t('layout.settings.accountSafety.devices.deleteFailed'))
  }
}

// 确认变更
const handleShowConfirm = () => {
  if (!currentAccount.value) return
  showConfirmDialog.value = true
}

const handleConfirmChange = () => {
  showConfirmDialog.value = false
  showChangeDialog.value = true
}

const handleUpdateSuccess = () => {
  fetchUserInfo()
}

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const userInfoRes = await apiGetAppUserInfo({})
    const data = userInfoRes.data || {}
    userPhone.value = data.phoneNumber || ''
    userEmail.value = data.email || ''
    wechatId.value = data.wechatId || null
    googleId.value = data.googleId || null
    appleId.value = data.appleId || null
  } catch (error) {
    console.error('获取用户信息失败', error)
  }
}

// 退出登录
const handleLogout = async () => {
  try {
    const res = await apiEscAppUser()
    if (res.code === 200) {
      showLogoutDialog.value = false
      router.push('/login')
    } else {
      alert(t('auth.errors.networkError'))
      showLogoutDialog.value = false
    }
  } catch (error) {
    console.error('退出登录失败', error)
    alert(t('auth.errors.networkError'))
    showLogoutDialog.value = false
  }
}

const fetchData = async () => {
  try {
    const countryRes = await apiGetUserCountry()
    userCountry.value = countryRes.data?.country || ''
    await fetchUserInfo()
    await fetchDevices()
  } catch (error) {
    console.error('获取数据失败', error)
  }
}

onMounted(() => {
  fetchData()
  googleInit()

  // 处理从绑定回调返回的参数（后备方案）
  if (route.query.refresh === 'true') {
    fetchUserInfo()
    router.replace({ query: {} })
  }
  // 绑定失败参数处理
  if (route.query.bindError === 'true') {
    bindErrorVisible.value = true
    router.replace({ query: {} })
  }
})
</script>

<style lang="scss" scoped>
.account-security {
  font-family: 'PingFang SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #1e1e1e;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  padding: 0 24px;
}

.security-section {
  & + .security-section {
    margin-top: 40px;
  }
}

.section-title {
  font-weight: 700;
  font-size: 16px;
  color: #1a1a1a;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
}

.method-list {
  width: 800px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.method-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 10px;
  border: 1px solid #f5f5f5;
  border-radius: 6px;
  margin-bottom: 10px;
  cursor: pointer;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: #f5f5f5;
    border: 1px solid #dddddd;
  }
}

.method-info {
  display: flex;
  font-size: 15px;
  line-height: 1.5;
}

.method-info1 {
  flex: 1;
  display: flex;
  font-size: 15px;
  line-height: 1.5;
}

.menu-svg {
  display: flex;
  width: 16px;
  height: 16px;
  margin-right: 5px;
  margin-top: 2.5px;
  align-content: center;
}

.next-svg {
  margin: 4px 5px auto auto;
}

.method-name {
  font-weight: 400;
  font-size: 14px;
  color: #1e1e1e;
}

.method-extra {
  font-size: 14px;
  margin-right: 10px;
}

.method-action {
  align-items: center;
  margin-right: 0px;
  margin-left: auto;
  color: rgba(0, 117, 255, 1);
}

.btn-add,
.btn-remove {
  font-size: 14px;
  background: transparent;
  cursor: pointer;
  border: none;
  transition: none;
  margin-right: 0;
  font-weight: 500;
}

.btn-add {
  color: rgba(0, 117, 255, 1);
}

.btn-remove {
  color: rgba(255, 32, 32, 1);
}

.device-table {
  width: 800px;
  height: 300px;
  display: flex;
  flex-direction: column;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 24px;
}

.table-header {
  display: flex;
  background-color: #fafafa;
  font-weight: 500;
  font-size: 14px;
  color: #6c6c6c;
  padding: 10px 16px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.device-rows {
  flex: 1;
  overflow-y: auto;
}

.table-row {
  display: flex;
  padding: 14px 16px;
  align-items: center;
  border-bottom: 1px solid #f5f5f5;
  background-color: #ffffff;

  &:last-child {
    border-bottom: none;
  }
}

.col-device,
.col-login,
.col-time,
.col-action .btn-delete {
  flex: 1;
  font-size: 14px;
}

.col-device {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.col-login {
  flex: 1;
}

.col-time {
  color: #5e5e5e;
  font-size: 14px;
}

.col-action {
  text-align: right;
  margin-right: 48px;
  width: 28px;
}

.device-badge {
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 4px;
  background-color: #f2f2f2;
  color: #4e4e4e;
  display: inline-block;
  line-height: 1.4;

  &.current {
    background-color: #e6f7ff;
    color: rgba(0, 117, 255, 1);
  }

  &.online {
    background-color: rgba(213, 227, 253, 0.4);
    color: rgba(0, 117, 255, 1);
  }

  &.active {
    background-color: #e6f7ff;
    color: rgba(0, 117, 255, 1);
  }
}

.btn-delete {
  margin-right: 35px;
  width: 28px;
  font-size: 14px;
  color: rgba(0, 117, 255, 1);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: none;
}

/* 退出登录 */
.logout-wrapper {
  margin-top: 32px;
  display: flex;
  justify-content: flex-start;
}

.btn-logout {
  font-size: 15px;
  font-weight: 500;
  color: rgba(255, 32, 32, 1);
  background: #ffffff;
  border: 1px solid #ffccc7;
  padding: 8px 30px;
  border-radius: 6px;
  cursor: pointer;
  transition: none;
  letter-spacing: 0.5px;

  &:hover {
    background-color: #ffe8e8;
  }
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.confirm-dialog {
  background: #fff;
  border-radius: 8px;
  width: 360px;
  padding: 24px;
}

.dialog-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 28px;
  text-align: left;
}

.cancel{
  margin: auto 5px 30px auto;
}

.confirm-question {
  font-size: 14px;
  margin-bottom: 15px;
  text-align: left;
  margin-bottom: 5px;
}

.current-account {
  font-size: 14px;
  margin-bottom: 30px;
  text-align: left;
}

.dialog-actions {
  display: flex;
  justify-content: end;
  gap: 14px;

  button {
    padding: 6px 28px;
    border-radius: 6px;
    font-size: 16px;
    cursor: pointer;
    border: none;
  }

  .btn-cancel {
    background: #fff;
    border: 1px solid #ddd;
  }

  .btn-confirm {
    background: rgba(0, 117, 255, 1);
    color: #fff;
    font-size: 16px;

    &:hover {
      background-color: rgba(0, 117, 255, 0.8);
    }
  }
}

.empty-devices {
  padding: 40px 16px;
  text-align: center;
  color: #999;
  font-size: 14px;
}
</style>