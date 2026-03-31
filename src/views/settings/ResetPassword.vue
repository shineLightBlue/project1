<template>
  <div style="display: flex;">
    <div class="container-left">
        <div class="forgot-password-wrapper">
        <img src="@/assets/logo/logo.jpg" alt="Notra" class="logo-icon" />
        <h2 class="forgot-title">{{ $t('auth.forgotPassword.submit') }}</h2>
        <p class="forgot-hint">
            {{ $t('auth.changePassword.hint1') }}<br />
            {{ $t('auth.changePassword.hint2') }}
        </p>
    
        <el-form
            ref="forgotFormRef"
            :model="forgotForm"
            :rules="forgotRules"
            label-position="top"
            class="forgot-form"
        >
            <el-form-item prop="account">
              <el-input
                class="forgot-input"
                v-model="forgotForm.account"
                :placeholder="$t('auth.forgotPassword.phoneOrEmail')"
                clearable
              />
            </el-form-item>
            <el-form-item prop="code" :error="codeError">
              <el-input
                class="forgot-input"
                v-model="forgotForm.code"
                :placeholder="$t('auth.forgotPassword.verificationCode')"
                @input="codeError = ''"
              >
                <template #suffix>
                  <el-button
                    type="primary"
                    link
                    :disabled="forgotCodeSending || forgotCountdown > 0"
                    @click="sendForgotCode"
                    tabindex="-1"
                    @mousedown.prevent
                  >
                    {{ forgotCountdown > 0 ? $t('auth.login.codeSentCountdown') + '(' + forgotCountdown + 's)' : $t('auth.register.getCode') }}
                  </el-button>
                </template>
            </el-input>
            </el-form-item>
            <el-form-item prop="newPassword">
              <el-input
                v-model="forgotForm.newPassword"
                type="password"
                :placeholder="$t('auth.forgotPassword.newPassword')"
                show-password
                class="forgot-input"
              />
            </el-form-item>
            <el-form-item prop="confirmPassword">
              <el-input
                v-model="forgotForm.confirmPassword"
                type="password"
                :placeholder="$t('auth.forgotPassword.confirmPassword')"
                show-password
                class="forgot-input"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" size="large" class="forgot-btn" @click="handleConfirm">
                {{ $t('auth.forgotPassword.confirm') }}
              </el-button>
            </el-form-item>
        </el-form>
        </div>
    </div>
    <div class="container-right">
      <img src="@/assets/logo/background.jpg" alt="BOYA Notra" class="showcase-image" />
    </div>
  </div>
</template>
  
<script setup>
  import { ref, reactive } from 'vue'
  import { useRouter, useRoute } from 'vue-router' 
  import { ElMessage } from 'element-plus'
  import { useI18n } from 'vue-i18n'
  import { apiSendCaptcha, apiCheckForgotCaptcha, apiResetPassword } from '@/api/index.ts'
  import JSEncrypt from 'jsencrypt'
  
  const { t } = useI18n()
  const router = useRouter()     
  const route = useRoute()      
  const returnUrl = route.query.returnUrl || '/account-security'  
  
  // 公钥加密
  const PUBLIC_KEY = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAlxBCAOjLMqvJkM5QLLIHy6e8mHAbOBk8f87Gf9pCdHQfkvtmSJ3ypKND8XUafb/r1PLDZ0fuAUIE5YqCdP/tvLyCI0lIhV8VilDZ/slo7W0yu20Wv9ROSkI4bFYDfIGYjZ2vN2kh4GoSirjCnK4bcfjOELwGjCPMhrLhITpYnz4DSJojFNYB8A+Sbb4Q13a+9g+Lk8fPnFSaFzF+OjHSBKN+Tkdfde3F2v+TtzdFEQeu3/W5mAJ6pZQedBS6DyxNxFX8sre/wh6/3Y9dUZdW+mIJXV2S++K9m8RlJvqC1OoK+3WfleHhV8q/Njrb4GS5UoPb6lTE36XX6bS16FsY5QIDAQAB'
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
  
  // 表单数据
  const forgotFormRef = ref(null)
  const forgotCountdown = ref(0)
  const forgotCodeSending = ref(false)
  const codeError = ref('')
  const forgotForm = reactive({
    account: '',
    code: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  // 验证规则
  const getForgotRules = () => ({
    account: [
      { required: true, message: t('auth.errors.phoneRequired'), trigger: 'blur' },
      { validator: (rule, value, callback) => {
          const phoneReg = /^1[3-9]\d{9}$/
          const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (phoneReg.test(value) || emailReg.test(value)) {
            callback()
          } else {
            callback(new Error(t('auth.errors.phoneInvalid')))
          }
        }, trigger: 'blur' }
    ],
    code: [
      { required: true, message: t('auth.errors.codeRequired'), trigger: 'blur' },
      { len: 6, message: t('auth.errors.codeInvalid'), trigger: 'blur' }
    ],
    newPassword: [
      { required: true, message: t('auth.errors.passwordRequired'), trigger: 'blur' },
      { min: 8, max: 20, message: t('auth.errors.passwordTooShort'), trigger: 'blur' },
      { pattern: /^(?![a-zA-Z]+$)(?!\d+$)(?![^\da-zA-Z\s]+$).{8,20}$/, 
        message: t('auth.errors.passwordFormatInvalid'), trigger: 'blur' }
    ],
    confirmPassword: [
      { required: true, message: t('auth.errors.passwordRequired'), trigger: 'blur' },
      { validator: (rule, value, callback) => {
          if (value !== forgotForm.newPassword) {
            callback(new Error(t('auth.errors.passwordMismatch')))
          } else {
            callback()
          }
        }, trigger: 'blur' }
    ]
  })
  const forgotRules = ref(getForgotRules())
  
  // 发送验证码
  const sendForgotCode = async () => {
    codeError.value = ''
  
    if (!forgotForm.account) {
      ElMessage.warning(t('auth.errors.phoneRequired'))
      return
    }
    const phoneReg = /^1[3-9]\d{9}$/
    const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!phoneReg.test(forgotForm.account) && !emailReg.test(forgotForm.account)) {
      ElMessage.warning(t('auth.errors.phoneInvalid'))
      return
    }
  
    if (forgotCodeSending.value || forgotCountdown.value > 0) return
    forgotCodeSending.value = true
    try {
      const res = await apiSendCaptcha({
        phoneNumberOrEmail: forgotForm.account,
        codeType: 8
      })
  
      if (res.code === 200) {
        ElMessage.success(t('auth.success.codeSent'))
        forgotCountdown.value = 60
        const timer = setInterval(() => {
          forgotCountdown.value--
          if (forgotCountdown.value <= 0) {
            clearInterval(timer)
            forgotCodeSending.value = false
          }
        }, 1000)
      } else {
        ElMessage.error(res.msg || t('auth.errors.sendCodeFailed'))
        forgotCodeSending.value = false
      }
    } catch (error) {
      ElMessage.error(t('auth.errors.networkError'))
      forgotCodeSending.value = false
    }
  }
  
  // 提交
  const handleConfirm = async () => {
    if (!forgotFormRef.value) return
  
    await forgotFormRef.value.validate(async (valid) => {
      if (valid) {
        try {
          const res = await apiCheckForgotCaptcha({
            phoneNumberOrEmail: forgotForm.account,
            captcha: forgotForm.code
          })
          
          if (res.code === 200) {
            try {
              const encryptedPassword = encryptPassword(forgotForm.newPassword)
              const encryptedConfirmPassword = encryptPassword(forgotForm.confirmPassword)
  
              const resetRes = await apiResetPassword({
                phoneNumberOrEmail: forgotForm.account,
                setPwdStr: encryptedPassword,
                setPwdConfirmStr: encryptedConfirmPassword
              })
              
              if (resetRes.code === 200) {
                forgotForm.account = ''
                forgotForm.code = ''
                forgotForm.newPassword = ''
                forgotForm.confirmPassword = ''
                forgotFormRef.value.clearValidate()
                codeError.value = ''
                ElMessage.success(t('auth.success.passwordReset'))
                // 成功后跳转回指定的返回页面
                router.replace(returnUrl)
              } else {
                ElMessage.error(resetRes.message || t('auth.errors.passwordResetFailed'))
              }
            } catch (error) {
              ElMessage.error(t('auth.errors.passwordResetFailed'))
            }
          } else {
            codeError.value = t('auth.errors.codeIncorrect')
          }
        } catch (error) {
          if (error && error.msg) {
            codeError.value = t('auth.errors.codeIncorrect')
          } else {
            ElMessage.error(t('auth.errors.networkError'))
          }
        }
      }
    })
  }
</script>
  
<style scoped>
.container-left{
    width: 60%;
    padding: 120px 150px 120px 220px;
}

.container-right{
    width: 40%;
    padding: 100px 35px;
    background-color: rgba(213, 227, 253, 0.24);
}

  .forgot-password-wrapper {
    width: 430px;
  }
  
  .logo-icon {
    width: 36px;
    height: 36px;
    margin-bottom: 14px;
    object-fit: contain;
  }
  
  .forgot-title {
    font-size: 22px;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 12px;
  }
  
  .forgot-hint {
    font-size: 13px;
    color: #909399;
    line-height: 1.6;
    margin-bottom: 24px;
    border-radius: 8px;
  }
  
  .forgot-form :deep(.el-form-item) {
    margin-bottom: 22px;
  }
  
  .forgot-form .el-form-item__label {
    font-weight: 500;
    color: #333;
    padding-bottom: 6px;
  }
  
  .forgot-input {
    height: 48px;
  }
  
  .forgot-form :deep(.el-input__wrapper) {
    box-shadow: none !important;
    background-color: rgba(247, 249, 255, 1);
    border-radius: 6px;
    padding: 5px;
    padding-left: 13px;
    transition: border-color 0.2s;
  }
  
  .forgot-form :deep(.el-input__wrapper:hover),
  .forgot-form :deep(.el-input__wrapper.is-focus) {
    box-shadow: none !important;
  }
  
  .forgot-form :deep(.el-input__wrapper.is-focus) {
    box-shadow: 0 0 0 1px #409eff inset;
  }
  
  .forgot-btn {
    width: 100%;
    height: 44px;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 500;
  }
  
  .forgot-btn.el-button--primary {
    background: rgba(0, 117, 255, 0.5);
    border: none;
  }
  
  .forgot-btn.el-button--primary:hover {
    background: rgba(0, 117, 255, 1);
  }
  
  .forgot-btn.el-button--default {
    border: 1px solid #dcdfe6;
    background: #fff;
    color: #606266;
  }
  
  .forgot-btn.el-button--default:hover {
    border-color: #409eff;
    color: #409eff;
  }

.showcase-image {
  width: 600px;
  height: 350px;
  margin-top: 100px;
  align-content: center;
  object-fit: contain;
}

</style>