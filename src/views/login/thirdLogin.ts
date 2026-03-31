import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { useLoginStore } from '@/stores/login.ts'
import { apiAppThirdLogin, apiBindThirdAccount } from '@/api'
import { setSessionStorage, getSessionStorage, removeSessionStorage } from '@/utils'
import { jwtDecode } from 'jwt-decode'
import { ElMessage } from 'element-plus'

export function useThirdLogin() {
  const { t } = useI18n()
  const router = useRouter()
  const route = useRoute()
  const loginStore = useLoginStore()

  // 绑定模式标志的 key
  const BIND_MODE_KEY = 'third_bind_mode'

  // 设置绑定模式标志
  function setBindMode() {
    setSessionStorage(BIND_MODE_KEY, 'true')
  }

  // 清除绑定模式标志
  function clearBindMode() {
    removeSessionStorage(BIND_MODE_KEY)
  }

  // 获取当前是否为绑定模式
  function getBindMode() {
    return getSessionStorage(BIND_MODE_KEY) === 'true'
  }

  //=============  firebase google 登录 =============
  async function googleInit() {
    console.log('init')
    await loadJs('https://www.gstatic.com/firebasejs/8.3.1/firebase-app.js', 'firebase-app')
    await loadJs(
      'https://www.gstatic.com/firebasejs/8.3.1/firebase-analytics.js',
      'firebase-analytics',
    )
    await loadJs('https://www.gstatic.com/firebasejs/8.3.1/firebase-auth.js', 'firebase-auth')
    firebaseInit()
  }

  /**
   * Google 登录/绑定，isLogin: true = 登录，false = 绑定
   */
  function googleLogin(isLogin = true) {
    return new Promise((resolve, reject) => {
      const provider = new firebase.auth.GoogleAuthProvider()
      firebase
        .auth()
        .signInWithPopup(provider)
        .then((result) => {
          console.log('firebase result', result)
          getFirebaseToken(isLogin)
            .then(resolve)
            .catch(reject)
        })
        .catch((error) => {
          console.error('Firebase signInWithPopup error', error)
          if (!isLogin) {
            const silentError = new Error(error.message || 'Google 授权失败')
            ;(silentError as any).silent = true
            reject(silentError)
          } else {
            ElMessage.error('Google 授权失败')
            reject(error)
          }
        })
    })
  }

  /**
   * 获取 firebase token，返回 Promise
   */
  function getFirebaseToken(isLogin) {
    return new Promise((resolve, reject) => {
      firebase
        .auth()
        .currentUser.getIdToken(true)
        .then((idToken) => {
          console.log('firebase token', idToken)
          const res = jwtDecode(idToken)
          console.log(res, 'res')
          appThirdLogin({
            thirdAccountType: 'google',
            thirdAccountId: res.sub,
            isLogin,
          })
            .then(resolve)
            .catch(reject)
        })
        .catch((error) => {
          console.error('getFirebaseToken error', error)
          reject(error)
        })
    })
  }

  function loadJs(src, id) {
    return new Promise((resolve, reject) => {
      var js
      var fjs = document.getElementsByTagName('script')[0]

      if (document.getElementById(id)) {
        resolve()
        return
      }
      js = document.createElement('script')
      js.id = id
      js.src = src
      fjs.parentNode.insertBefore(js, fjs)
      js.onload = () => resolve()
      js.onerror = () => reject(new Error(`Failed to load script: ${src}`))
    })
  }

  function firebaseInit() {
    const firebaseConfig = {
      apiKey: 'AIzaSyDq1dmFflfr7Stg8UuNp0k6ouEtiupBJWM',
      authDomain: 'boya-notra-59fd6.firebaseapp.com',
      projectId: 'boya-notra-59fd6',
      storageBucket: 'boya-notra-59fd6.firebasestorage.app',
      messagingSenderId: '68538811473',
      appId: '1:68538811473:web:28e5401202f39c76906470',
    }
    console.log('firebase', firebase)
    if (firebase.apps.length === 0) {
      firebase.initializeApp(firebaseConfig)
      firebase.analytics()
    }
  }

  /**
   * 微信登录跳转，isLogin = true 登录，false 绑定模式
   */
  function wechatLogin(isLogin = true) {
    const uri = location.origin
    const appId = 'wx7a8645a665531bc0'
    const redirectUri = uri + '/oauth/callback'
    const responseType = 'code'
    const scope = 'snsapi_login'
    const state = `wechat|${Date.now()}|${Math.random().toString(36).substring(2)}`

    setSessionStorage('wx_oauth_state', state)
    setSessionStorage('loginType', 'wx')
    if (!isLogin) {
      setBindMode()
    }

    const authUrl =
      `https://open.weixin.qq.com/connect/qrconnect?` +
      `appid=${appId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=${responseType}&` +
      `scope=${scope}&` +
      `state=${state}`

    window.location.href = authUrl
  }

  /**
   * 苹果ID登录跳转，isLogin = true 登录，false 绑定模式
   * 失败场景需在回调页面通过 URL 参数传递
   */
  function appleLogin(isLogin = true) {
    setSessionStorage('loginType', 'apple')
    if (!isLogin) {
        console.log('设置绑定模式标志')
        setBindMode()
    } else {
        console.log('登录模式，未设置绑定标志')
    }
    window.location.href = location.origin + '/prod-api/app/apple/login/authUrl'
  }

  /**
   * 第三方登录/绑定核心函数
   * 返回 Promise，失败时抛出错误
   * 绑定模式下抛出的错误会带有 silent: true 属性，调用方可据此决定是否显示消息条
   */
  async function appThirdLogin({
    thirdAccountType,
    thirdAccountId,
    isLogin = true,
  }) {
    let extraParams = {}
    if (thirdAccountType === 'apple') {
      extraParams.thirdAccountInfo = route.query.appleAccountInfo
    }

    const commonParams = {
      thirdAccountType,
      thirdAccountId,
      appVersion: '100',
      deviceModel: getBrowserInfo().browser,
      platform: 'web',
      deviceId: getDeviceId(),
      ...extraParams,
    }

    try {
      let res
      if (isLogin) {
        res = await apiAppThirdLogin(commonParams)
      } else {
        res = await apiBindThirdAccount(commonParams, { showError: false });
      }

      if (res.code === 200) {
        if (isLogin) {
          loginSuccess(res.data)
        } else {
          ElMessage.success(
            t('layout.settings.accountSafety.bindThirdAccountSuccess', {
              type: t(`layout.settings.accountSafety.loginMethods.thirdAccountTypes.${thirdAccountType}`),
            })
          )
          clearBindMode()
          router.push('/settings/account-security?refresh=true')
        }
        return
      } else {
        const errorMsg = res.msg || (isLogin ? '登录失败' : '绑定失败')
        const error = new Error(errorMsg)
        // 绑定模式下设置 silent 标识
        if (!isLogin) {
          ;(error as any).silent = true
        }
        throw error
      }
    } catch (error) {
      console.error('第三方操作失败', error)
      // 只有登录模式下且错误没有 silent 标识时才显示消息条
      if (isLogin && !(error as any)?.silent) {
        ElMessage.error((error as Error).message || '操作失败')
      }
      // 重新抛出，让调用方处理
      throw error
    }
  }

  /**
   * 登录成功处理
   */
  function loginSuccess(data) {
    ElMessage.success(t('auth.success.loginSuccess'))
    loginStore.setLoginStore(data)
    router.push('/')
  }

  /**
   * 浏览器信息
   */
  function getBrowserInfo() {
    const ua = navigator.userAgent

    let browser = 'Unknown'
    let version = 'Unknown'

    if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edge') === -1) {
      browser = 'Chrome'
      version = ua.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/)?.[1] || 'Unknown'
    } else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
      browser = 'Safari'
      version = ua.match(/Version\/(\d+\.\d+\.\d+)/)?.[1] || 'Unknown'
    } else if (ua.indexOf('Firefox') > -1) {
      browser = 'Firefox'
      version = ua.match(/Firefox\/(\d+\.\d+)/)?.[1] || 'Unknown'
    } else if (ua.indexOf('Edge') > -1) {
      browser = 'Edge'
      version = ua.match(/Edge\/(\d+\.\d+\.\d+\.\d+)/)?.[1] || 'Unknown'
    } else if (ua.indexOf('MSIE') > -1 || ua.indexOf('Trident') > -1) {
      browser = 'IE'
      version = ua.match(/(?:MSIE |rv:)(\d+\.\d+)/)?.[1] || 'Unknown'
    }

    let os = 'Unknown'
    if (ua.indexOf('Win') > -1) os = 'Windows'
    else if (ua.indexOf('Mac') > -1) os = 'macOS'
    else if (ua.indexOf('Linux') > -1) os = 'Linux'
    else if (ua.indexOf('Android') > -1) os = 'Android'
    else if (ua.indexOf('iOS') > -1 || ua.indexOf('iPhone') > -1) os = 'iOS'

    return {
      browser,
      version,
      os,
      userAgent: ua,
    }
  }

  /**
   * 获取或生成唯一设备 ID
   */
  function getDeviceId() {
    const STORAGE_KEY = 'device_id'
    let deviceId = localStorage.getItem(STORAGE_KEY)
    if (!deviceId) {
      deviceId = generateUUID()
      localStorage.setItem(STORAGE_KEY, deviceId)
    }
    return deviceId
  }

  /**
   * 生成 UUID v4
   */
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  return {
    googleInit,
    googleLogin,
    wechatLogin,
    appleLogin,
    appThirdLogin,
    getBindMode,
    clearBindMode,
  }
}