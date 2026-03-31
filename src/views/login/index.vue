<template>
  <div class="login-container">
    <!-- 左侧 -->
    <div class="login-form-section">
      <div class="login-form-wrapper">
        <div v-if="countryLoading" class="loading-tip"></div>
        <template v-else>
          <div v-if="!showForgot">
            <div class="logo-section">
              <img src="@/assets/logo/logo.jpg" alt="Notra" class="logo-icon" />
              <h1 class="login-title">{{ $t('auth.login.title') }}</h1>
            </div>

            <div class="third-party-login">
              <el-button class="third-party-btn" @click="googleLogin">
                <img src="@/assets/logo/google.svg" alt="google" class="btn-icon" />
                <span>{{ $t('auth.login.google') }}</span>
              </el-button>
              <el-button class="third-party-btn" @click="appleLogin">
                <img src="@/assets/logo/apple.svg" alt="apple" class="btn-icon" />
                <span>{{ $t('auth.login.apple') }}</span>
              </el-button>
              <el-button class="third-party-btn" @click="wechatLogin">
                <img src="@/assets/logo/wechat.png" alt="wechat" class="btn-icon" />
                <span>{{ $t('auth.login.wechat') }}</span>
              </el-button>
            </div>
            <div class="divider">
              <span class="divider-line"></span>
              <span class="divider-text">{{ $t('auth.login.or') }}</span>
              <span class="divider-line"></span>
            </div>

            <!--手机号/邮箱 + 验证码/密码 -->
            <el-form
              :model="loginForm"
              :rules="loginRules"
              ref="loginFormRef"
              class="login-form"
              :validate-on-rule-change="false"
            >
              <el-form-item prop="account">
                <el-input
                  v-model="loginForm.account"
                  :placeholder="accountPlaceholder"
                  size="large"
                  clearable
                  @input="loginError = ''"
                />
              </el-form-item>
              <el-form-item
                v-if="loginMode === 'code'"
                prop="code"
                :error="loginMode === 'code' ? loginError : ''"
              >
                <el-input
                  v-model="loginForm.code"
                  :placeholder="$t('auth.login.verificationCode')"
                  size="large"
                >
                  <template #suffix>
                    <el-button
                      type="primary"
                      link
                      class="suffix-btn"
                      :disabled="!isAccountValid || countdown > 0"
                      @click="handleGetCode"
                      tabindex="-1"
                      @mousedown.prevent
                    >
                      {{
                        countdown > 0
                          ? $t('auth.login.codeSentCountdown') + '(' + countdown + 's)'
                          : $t('auth.register.getCode')
                      }}
                    </el-button>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item
                v-if="loginMode === 'password'"
                prop="password"
                class="password-field"
                :error="loginMode === 'password' ? loginError : ''"
              >
                <el-input
                  v-model="loginForm.password"
                  type="password"
                  :placeholder="$t('auth.login.password')"
                  size="large"
                  clearable
                  show-password
                />
                <el-button type="primary" link class="suffix-btn" @click="showForgot = true">
                  {{ $t('auth.login.forgotPassword') }}
                </el-button>
              </el-form-item>

              <!--隐私与用户协议-->
              <div class="agreement-section">
                <div class="agreement-line">{{ agreementHint }}</div>
                <div class="agreement-line">
                  {{ $t('auth.login.agreementPrefix') }}
                  <a :href="userAgreementUrl" target="_blank" class="link">{{
                    $t('auth.login.userAgreement')
                  }}</a>
                  {{ $t('auth.login.agreementAnd') }}
                  <a :href="privacyPolicyUrl" target="_blank" class="link">{{
                    $t('auth.login.privacyPolicy')
                  }}</a>
                </div>
              </div>

              <el-form-item>
                <el-button
                  type="primary"
                  size="large"
                  class="login-btn"
                  @click="handleLogin"
                  :loading="loading"
                  :disabled="!isLoginValid"
                >
                  {{ $t('auth.login.submit') }}
                </el-button>
              </el-form-item>
            </el-form>

            <div class="mode-switch">
              <el-button type="primary" link @click="toggleMode">
                <img src="@/assets/images/icon-switch.svg" alt="switch" class="switch-icon" />
                <span>{{ modeSwitchText }}</span>
              </el-button>
            </div>
          </div>

          <!-- 忘记密码 -->
          <ForgotPassword v-else @close="showForgot = false" />
        </template>
      </div>
    </div>

    <!-- 右侧 -->
    <div class="showcase-section">
      <img src="@/assets/logo/background.jpg" alt="BOYA Notra" class="showcase-image" />
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { apiGetUserCountry, apiLogin, apiSendCaptcha } from '@/api/index.ts'
import { useLoginStore } from '@/stores/login.ts'
import { getPolicyLink } from '@/utils/policyLinks.ts'
import JSEncrypt from 'jsencrypt'
import ForgotPassword from '@/components/ForgotPassword.vue'
import { useThirdLogin } from '@/views/login/thirdLogin.js'

const router = useRouter()
const loginStore = useLoginStore()
const { t, locale } = useI18n()

const userAgreementUrl = computed(() => getPolicyLink('agreement', locale.value))
const privacyPolicyUrl = computed(() => getPolicyLink('privacy', locale.value))

const countryLoading = ref(true)
const isChina = ref(true)

onMounted(async () => {
  try {
    const res = await apiGetUserCountry()
    if (res.code === 200 && res.data.country === '中国') {
      isChina.value = true
    } else {
      isChina.value = false
    }
  } catch (error) {
    isChina.value = true
  } finally {
    countryLoading.value = false
    updateLoginRules()
  }
})

// 公钥加密
const PUBLIC_KEY =
  'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAlxBCAOjLMqvJkM5QLLIHy6e8mHAbOBk8f87Gf9pCdHQfkvtmSJ3ypKND8XUafb/r1PLDZ0fuAUIE5YqCdP/tvLyCI0lIhV8VilDZ/slo7W0yu20Wv9ROSkI4bFYDfIGYjZ2vN2kh4GoSirjCnK4bcfjOELwGjCPMhrLhITpYnz4DSJojFNYB8A+Sbb4Q13a+9g+Lk8fPnFSaFzF+OjHSBKN+Tkdfde3F2v+TtzdFEQeu3/W5mAJ6pZQedBS6DyxNxFX8sre/wh6/3Y9dUZdW+mIJXV2S++K9m8RlJvqC1OoK+3WfleHhV8q/Njrb4GS5UoPb6lTE36XX6bS16FsY5QIDAQAB'
const encryptPassword = (password) => {
  try {
    const encryptor = new JSEncrypt()
    encryptor.setPublicKey(PUBLIC_KEY)
    const encrypted = encryptor.encrypt(password)

    if (!encrypted) throw new Error('加密返回空值，请检查公钥格式')
    return encrypted
  } catch (error) {
    throw error
  }
}

const showForgot = ref(false)

const loginFormRef = ref(null)
const loading = ref(false)
const countdown = ref(0)
const loginMode = ref('code')
const loginError = ref('')

const loginForm = reactive({
  account: '',
  code: '',
  password: '',
})

// 判断账号是否合法（手机号或邮箱格式）
const isAccountValid = computed(() => {
  const account = loginForm.account
  console.log('isChina.value',isChina.value)
  if (isChina.value) {
    // 中国大陆手机号：11位数字，以1开头
    return /^1[3-9]\d{9}$/.test(account)
  } else {
    // 邮箱格式：包含 @ 和域名
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account)
  }
})

const getAccountRules = () => {
  if (isChina.value) {
    return [
      { required: true, message: t('auth.errors.phoneRequired'), trigger: 'blur' },
      { pattern: /^1[3-9]\d{9}$/, message: t('auth.errors.phoneInvalid'), trigger: 'blur' },
    ]
  } else {
    return [
      { required: true, message: t('auth.errors.emailRequired'), trigger: 'blur' },
      { type: 'email', message: t('auth.errors.emailInvalid'), trigger: 'blur' },
    ]
  }
}

const getLoginRules = () => {
  const baseRules = {
    account: getAccountRules(),
  }
  if (loginMode.value === 'code') {
    baseRules.code = [
      { required: true, message: t('auth.errors.codeRequired'), trigger: 'blur' },
      { len: 6, message: t('auth.errors.codeInvalid'), trigger: 'blur' },
    ]
  } else {
    baseRules.password = [
      { required: true, message: t('auth.errors.passwordRequired'), trigger: 'blur' },
      { min: 6, max: 20, message: t('auth.errors.passwordTooShort'), trigger: 'blur' },
      {
        pattern: /^(?![a-zA-Z]+$)(?!\d+$)(?![^\da-zA-Z\s]+$).{6,20}$/,
        message: t('auth.errors.passwordFormatInvalid'),
        trigger: 'blur',
      },
    ]
  }
  return baseRules
}

const loginRules = ref(getLoginRules())

const updateLoginRules = () => {
  loginRules.value = getLoginRules()
  nextTick(() => {
    loginFormRef.value?.clearValidate()
  })
}

const accountPlaceholder = computed(() => {
  return isChina.value ? t('auth.login.phoneNumber') : t('auth.login.email')
})

const agreementHint = computed(() => {
  if (loginMode.value === 'code') {
    return isChina.value ? t('auth.login.autoRegister') : t('auth.login.autoRegisterEmail')
  } else {
    return isChina.value ? t('auth.login.autoRegister') : t('auth.login.autoRegisterEmail')
  }
})

const modeSwitchText = computed(() => {
  return loginMode.value === 'code'
    ? t('auth.login.passwordLogin')
    : t('auth.login.verificationCodeLogin')
})

const isLoginValid = computed(() => {
  const account = loginForm.account
  if (isChina.value) {
    if (!/^1[3-9]\d{9}$/.test(account)) return false
  } else {
    const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailReg.test(account)) return false
  }
  if (loginMode.value === 'code') {
    return /^\d{6}$/.test(loginForm.code)
  } else {
    return loginForm.password.length >= 6
  }
})

/** 登录验证码：校验账号格式后调用 apiSendCaptcha，成功后启动 60 秒倒计时 */
const handleGetCode = async () => {
  loginError.value = ''
  const account = loginForm.account
  if (!account) {
    ElMessage.warning(
      isChina.value ? t('auth.errors.phoneRequired') : t('auth.errors.emailRequired'),
    )
    return
  }
  if (isChina.value) {
    if (!/^1[3-9]\d{9}$/.test(account)) {
      ElMessage.warning(t('auth.errors.phoneInvalid'))
      return
    }
  } else {
    const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailReg.test(account)) {
      ElMessage.warning(t('auth.errors.emailInvalid'))
      return
    }
  }
  try {
    const codeType = isChina.value ? 4 : 0
    const res = await apiSendCaptcha({
      phoneNumberOrEmail: account,
      codeType,
    })

    if (res.code === 200) {
      ElMessage.success(t('auth.success.codeSent'))
      countdown.value = 60
      const timer = setInterval(() => {
        countdown.value--
        if (countdown.value <= 0) {
          clearInterval(timer)
        }
      }, 1000)
    } else {
      ElMessage.error(res.message || t('auth.errors.sendCodeFailed'))
    }
  } catch (error) {
    ElMessage.error(t('auth.errors.networkError'))
  }
}

const toggleMode = () => {
  loginMode.value = loginMode.value === 'code' ? 'password' : 'code'
  loginForm.password = ''
  loginForm.code = ''
  loginError.value = ''
  // 更新验证规则
  updateLoginRules()
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      loginError.value = ''

      let loginType
      if (isChina.value) loginType = loginMode.value === 'code' ? '0' : '1'
      else loginType = loginMode.value === 'code' ? '2' : '3'

      // 密码加密
      let pwd
      if (loginMode.value === 'code') {
        pwd = loginForm.code
      } else {
        try {
          pwd = encryptPassword(loginForm.password)
        } catch (error) {
          loginError.value = t('auth.errors.passwordResetFailed')
          loading.value = false
          return
        }
      }

      try {
        const res = await apiLogin({
          loginAccount: loginForm.account,
          pwd,
          loginType,
          platform: 'web',
        })
        if (res.code === 200) {
          ElMessage.success(t('auth.success.loginSuccess'))
          loginStore.setLoginStore(res.data)
          router.push('/')
        } else {
          loginError.value =
            loginMode.value === 'code'
              ? t('auth.errors.codeIncorrect')
              : isChina.value
                ? t('auth.errors.phonePasswordError')
                : t('auth.errors.emailPasswordError')
        }
      } catch (error) {
        loginError.value =
          loginMode.value === 'code'
            ? t('auth.errors.codeIncorrect')
            : isChina.value
              ? t('auth.errors.phonePasswordError')
              : t('auth.errors.emailPasswordError')
      } finally {
        loading.value = false
      }
    }
  })
}
// 第三方登录
const { googleInit, googleLogin, appleLogin, wechatLogin } = useThirdLogin()
googleInit()
</script>

<style scoped>
.login-container {
  display: flex;
  min-height: 100vh;
  width: 100%;
  background: #fff;
}

.login-form-section {
  width: 45%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 50px;
  background: #fff;
}

.login-form-wrapper {
  width: 100%;
  max-width: 400px;
  text-align: left;
  margin-left: 180px;
}

.logo-section {
  margin-bottom: 36px;
  text-align: left;
}

.logo-icon {
  width: 36px;
  height: 36px;
  margin-bottom: 14px;
  object-fit: contain;
}

.login-title {
  font-size: 22px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.third-party-login {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
}

.third-party-btn {
  flex: 1;
  height: 38px;
  min-width: 128px;
  border-radius: 6px;
  border: 1px solid #dcdfe6;
  background: #fff !important;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  color: #333 !important;
  padding: 0 10px;
  transition: all 0.2s;
}

.third-party-btn:hover,
.third-party-btn:focus {
  border-color: #409eff;
  color: #409eff !important;
  background: #fff !important;
}

.btn-icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
  margin-right: 3px;
}

.divider {
  display: flex;
  align-items: center;
  margin: 20px 0;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: #e4e7ed;
}

.divider-text {
  padding: 0 16px;
  color: #c0c4cc;
  font-size: 13px;
}

.login-form {
  margin-bottom: 0;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 18px;
  border: none;
}

.login-form :deep(.el-input__wrapper),
.forgot-form :deep(.el-input__wrapper) {
  box-shadow: none !important;
  background-color: rgba(247, 249, 255, 1);
  color:rgba(154, 154, 154, 1);
  border-radius: 6px;
  padding: 5px;
  padding-left: 13px;
  transition: border-color 0.2s;
}

.login-form :deep(.el-input__wrapper:hover),
.forgot-form :deep(.el-input__wrapper:hover),
.login-form :deep(.el-input__wrapper.is-focus),
.forgot-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: none !important;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #409eff inset;
}

.suffix-btn {
  white-space: nowrap;
  font-size: 13px;
  padding: 0 4px;
  margin-right: 0px;
}

.password-field {
  position: relative;
}

.password-field .suffix-btn {
  margin-top: 4px;
  margin-right: 0;
  margin-left: auto;
}

.agreement-section {
  margin-bottom: 22px;
  text-align: left;
}

.agreement-line {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.7);
  line-height: 1.8;
}

.agreement-line .link {
  color: #409eff;
  text-decoration: none;
}

.agreement-line .link:hover {
  text-decoration: underline;
}

.login-btn {
  width: 100%;
  height: 44px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  background: rgba(0, 117, 255, 0.8);
  border: none;
  letter-spacing: 2px;
  color: white;
  transition: background 0.2s;
}

.login-btn:disabled {
  background: rgba(0, 117, 255, 0.5);
  cursor: not-allowed;
  opacity: 0.6;
}

.login-btn:hover:not(:disabled) {
  background: rgba(0, 117, 255, 1);
}

.mode-switch {
  text-align: center;
  margin-top: 12px;
}

.mode-switch .el-button {
  font-size: 13px;
  color: rgba(0, 117, 255, 1);
}

.switch-icon {
  width: 18px;
  height: 18px;
  margin-right: 5px;
  vertical-align: middle;
}

.showcase-section {
  width: 60%;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7f8fc;
  padding: 20px;
  overflow: hidden;
}

.showcase-image {
  max-width: 100%;
  max-height: 100vh;
  object-fit: contain;
}

@media (max-width: 992px) {
  .login-container {
    flex-direction: column;
  }

  .login-form-section {
    flex: none;
    width: 100%;
    padding: 40px 24px;
  }

  .showcase-section {
    flex: none;
    width: 100%;
    min-height: 300px;
    order: -1;
    padding: 24px;
  }
}
</style>
