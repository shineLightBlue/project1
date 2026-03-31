<template>
  <div class="page"></div>
</template>
<script lang="ts" setup>
import { getSessionStorage, removeSessionStorage } from '@/utils'
import { useI18n } from 'vue-i18n'
import { useLoginStore } from '@/stores/login.ts'
import { useThirdLogin } from '@/views/login/thirdLogin.ts'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const loginStore = useLoginStore()

// 导入需要的函数
const { appThirdLogin, getBindMode, clearBindMode } = useThirdLogin()

const loginType = getSessionStorage('loginType')
const wxState = getSessionStorage('wx_oauth_state')
const state = route.query.state

onMounted(init)

function init() {
  // 获取绑定模式标志
  const isBindMode = getBindMode()
  console.log('isBindMode:', isBindMode)

  // 绑定模式 + 已登录 → 调用绑定接口；否则调用登录接口
  const isLoggedIn = !!loginStore.loginData.token
  const isLogin = !(isBindMode && isLoggedIn)

  if (loginType === 'wx') {
    if (state !== wxState) {
      console.log('微信 state 校验失败')
      return
    }
    removeSessionStorage('loginType')
    appThirdLogin({
      thirdAccountType: 'wechat_web',
      thirdAccountId: route.query.code as string,
      isLogin,
    })
      .then(() => {
        if (isBindMode) clearBindMode()
      })
      .catch((error) => {
        console.error('微信绑定/登录失败', error)
        if (isBindMode) {
          clearBindMode()
          router.replace('/settings/account-security?bindError=true')
        } else {
          router.replace('/login?error=true')
        }
      })
    return
  }

  // 苹果登录回调
  if (route.query.appleId) {
    console.log('苹果登录回调，appleId:', route.query.appleId)
    removeSessionStorage('loginType')
    appThirdLogin({
      thirdAccountType: 'apple',
      thirdAccountId: route.query.appleId as string,
      isLogin,
    })
      .then(() => {
        if (isBindMode) clearBindMode()
      })
      .catch((error) => {
        console.error('苹果绑定/登录失败', error)
        if (isBindMode) {
          clearBindMode()
          // 绑定失败，返回账户安全页并显示错误弹窗
          router.replace('/settings/account-security?bindError=true')
        } else {
          // 登录失败，返回登录页
          router.replace('/login?error=true')
        }
      })
  } else {
    if (isBindMode) {
      clearBindMode()
      router.replace('/settings/account-security?bindError=true')
    } else {
      router.replace('/login?error=true')
    }
  }
}
</script>

<style scoped>
.page {
  height: 100vh;
}
</style>