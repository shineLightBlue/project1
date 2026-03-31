<template>
  <div v-if="visible" class="dialog-overlay">
    <div class="dialog-content">
      <!-- 验证旧身份 -->
      <div v-if="step === 1" class="step-verify">
        <h3 class="dialog-title">
          {{ $t(verifyTitleKey) }}
          <button class="btn-close" @click="handleClose">
            <img src="@/assets/images/icon_close.svg" class="menu-svg" />
          </button>
        </h3>
        <p class="step-desc">
          {{
            $t(verifyDescKey, {
              [type === 'phone' ? 'phone' : 'email']: maskedAccount,
            })
          }}
        </p>
        <div class="form-item step1-code-item">
          <div class="input-wrapper">
            <input
              v-model="verifyCode"
              type="text"
              :placeholder="$t('auth.login.verificationCode')"
              maxlength="6"
              @input="clearStep1CodeError"
              @blur="validateStep1Code"
              @keyup.enter="handleVerify"
            />
            <button
              class="btn-send-inline"
              :disabled="countdown > 0"
              @click="sendVerifyCode"
            >
              {{
                countdown > 0
                  ? `${$t('auth.login.codeSentCountdown')} (${countdown}s)`
                  : $t('auth.register.getCode')
              }}
            </button>
          </div>
        </div>
        <div v-if="step1CodeError" class="error-message">{{ step1CodeError }}</div>
        <div v-else class="error-message"></div>
        <div class="dialog-actions">
          <button
            class="btn-confirm"
            :disabled="!verifyCode || !isStep1CodeValid || step1CodeError !== ''"
            @click="handleVerify"
          >
            {{ $t('common.confirm') }}
          </button>
        </div>
      </div>

      <!-- 填写新账号 -->
      <div v-else-if="step === 2" class="step-new">
        <h3 class="dialog-title">
          {{ $t(changeTitleKey) }}
          <button class="btn-close" @click="handleClose">
            <img src="@/assets/images/icon_close.svg" class="menu-svg" />
          </button>
        </h3>
        <p class="step-desc">{{ $t(enterNewAccountKey) }}</p>

        <!-- 新账号 -->
        <div class="form-item">
          <input
            v-model="newAccount"
            :type="type === 'phone' ? 'tel' : 'email'"
            :placeholder="$t(enterNewAccountKey)"
            @input="clearNewAccountError"
            @blur="validateNewAccount"
          />
        </div>
        <div v-if="step2AccountError" class="error-message">{{ step2AccountError }}</div>
        <div v-else class="error-message"></div>

        <!-- 验证码输入框-->
        <div class="form-item step2-code-item">
          <div class="input-wrapper">
            <input
              v-model="newCode"
              type="text"
              :placeholder="$t('auth.login.verificationCode')"
              maxlength="6"
              @input="clearNewCodeError"
              @blur="validateNewCode"
              @keyup.enter="handleConfirm"
            />
            <button
              class="btn-send-inline"
              :disabled="newCountdown > 0 || !isNewAccountValid || step2AccountError !== ''"
              @click="sendNewCode"
            >
              {{
                newCountdown > 0
                  ? `${newCountdown}s${$t('auth.login.resend')}`
                  : $t('auth.login.getCode')
              }}
            </button>
          </div>
        </div>
        <div v-if="step2CodeError" class="error-message">{{ step2CodeError }}</div>
        <div v-else class="error-message"></div>

        <div class="dialog-actions">
          <button
            class="btn-confirm"
            :disabled="!isNewAccountValid || !isNewCodeValid || step2AccountError !== '' || step2CodeError !== ''"
            @click="handleConfirm"
          >
            {{ $t('common.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { apiSendCaptcha } from '@/api/index.ts'
import {
  updateUserPhoneNumberSend,
  updateUserPhoneNumberConfirm,
  updateUserEmailSend,
  updateUserEmailConfirm,
} from '@/api/index.ts'

const { t } = useI18n()

const props = defineProps<{
  visible: boolean
  type: 'phone' | 'email'
  currentAccount: string
}>()

const emit = defineEmits(['update:visible', 'success'])

const step = ref(1)

const countdown = ref(0)
const timer = ref<number>()
const newCountdown = ref(0)
const newTimer = ref<number>()

const verifyCode = ref('')
const newAccount = ref('')
const newCode = ref('')

const step1CodeError = ref('')
const step2AccountError = ref('')
const step2CodeError = ref('')

const verifyTitleKey = computed(() =>
  props.type === 'phone'
    ? 'layout.settings.accountSafety.changePhone.verifyTitle'
    : 'layout.settings.accountSafety.changeEmail.verifyTitle'
)
const verifyDescKey = computed(() =>
  props.type === 'phone'
    ? 'layout.settings.accountSafety.changePhone.verifyOldPhoneText'
    : 'layout.settings.accountSafety.changeEmail.verifyOldEmailText'
)
const changeTitleKey = computed(() =>
  props.type === 'phone'
    ? 'layout.settings.accountSafety.changePhone.changeTitle'
    : 'layout.settings.accountSafety.changeEmail.changeTitle'
)
const enterNewAccountKey = computed(() =>
  props.type === 'phone'
    ? 'layout.settings.accountSafety.changePhone.enterNewPhone'
    : 'layout.settings.accountSafety.changeEmail.enterNewEmail'
)

// 脱敏显示当前账号
const maskedAccount = computed(() => {
  const acc = props.currentAccount
  if (!acc) return ''
  if (props.type === 'phone') {
    return acc.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
  } else {
    const [name, domain] = acc.split('@')
    if (name.length <= 3) return name + '***@' + domain
    return name.slice(0, 3) + '***@' + domain
  }
})

// 实时格式校验
const isStep1CodeValid = computed(() => /^\d{6}$/.test(verifyCode.value))

const isValidPhone = (phone: string) => /^1\d{10}$/.test(phone)
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const isNewAccountValid = computed(() => {
  if (!newAccount.value) return false
  if (props.type === 'phone') return isValidPhone(newAccount.value)
  else return isValidEmail(newAccount.value)
})

const isNewCodeValid = computed(() => /^\d{6}$/.test(newCode.value))

const handleClose = () => {
  emit('update:visible', false)
  resetState()
}

const resetState = () => {
  step.value = 1
  verifyCode.value = ''
  newAccount.value = ''
  newCode.value = ''
  step1CodeError.value = ''
  step2AccountError.value = ''
  step2CodeError.value = ''
  clearCountdown()
  clearNewCountdown()
}

const clearCountdown = () => {
  if (timer.value) clearInterval(timer.value)
  countdown.value = 0
}
const clearNewCountdown = () => {
  if (newTimer.value) clearInterval(newTimer.value)
  newCountdown.value = 0
}

// 发送验证码
const sendVerifyCode = async () => {
  step1CodeError.value = ''
  try {
    await apiSendCaptcha({
      phoneNumberOrEmail: props.currentAccount,
      codeType: 5,
    })
    countdown.value = 60
    if (timer.value) clearInterval(timer.value)
    timer.value = setInterval(() => {
      if (countdown.value > 0) countdown.value--
      else clearInterval(timer.value)
    }, 1000)
  } catch (error) {
    console.error('发送验证码失败', error)
    step1CodeError.value = t('auth.errors.sendCodeFailed')
  }
}

// 验证第一步验证码
const handleVerify = async () => {
  step1CodeError.value = ''
  if (!isStep1CodeValid.value) {
    step1CodeError.value = t('auth.errors.codeInvalid')
    return
  }
  try {
    if (props.type === 'phone') {
      await updateUserPhoneNumberSend({
        oldPhoneNumber: props.currentAccount,
        captcha: verifyCode.value,
      })
    } else {
      await updateUserEmailSend({
        oldEmail: props.currentAccount,
        captcha: verifyCode.value,
      })
    }
    step.value = 2
    clearCountdown()
    newAccount.value = ''
    newCode.value = ''
    step2AccountError.value = ''
    step2CodeError.value = ''
  } catch (error) {
    console.error('验证失败', error)
    step1CodeError.value = t('auth.errors.codeIncorrect')
  }
}

// 发送新账号的验证码
const sendNewCode = async () => {
  step2AccountError.value = ''
  if (!isNewAccountValid.value) {
    step2AccountError.value =
      props.type === 'phone' ? t('auth.errors.phoneInvalid') : t('auth.errors.emailInvalid')
    return
  }
  try {
    await apiSendCaptcha({
      phoneNumberOrEmail: newAccount.value,
      codeType: 6,
    })
    newCountdown.value = 60
    if (newTimer.value) clearInterval(newTimer.value)
    newTimer.value = setInterval(() => {
      if (newCountdown.value > 0) newCountdown.value--
      else clearInterval(newTimer.value)
    }, 1000)
  } catch (error) {
    console.error('发送验证码失败', error)
    step2AccountError.value = t('auth.errors.sendCodeFailed')
  }
}

const handleConfirm = async () => {
  step2AccountError.value = ''
  step2CodeError.value = ''
  if (!isNewAccountValid.value) {
    step2AccountError.value =
      props.type === 'phone' ? t('auth.errors.phoneInvalid') : t('auth.errors.emailInvalid')
    return
  }
  if (!isNewCodeValid.value) {
    step2CodeError.value = t('auth.errors.codeInvalid')
    return
  }
  try {
    if (props.type === 'phone') {
      await updateUserPhoneNumberConfirm({
        newPhoneNumber: newAccount.value,
        captcha: newCode.value,
      })
    } else {
      await updateUserEmailConfirm({
        newEmail: newAccount.value,
        captcha: newCode.value,
      })
    }
    emit('success')
    handleClose()
  } catch (error) {
    console.error('修改失败', error)
    step2CodeError.value = t('auth.errors.codeIncorrect')
  }
}

const clearStep1CodeError = () => {
  step1CodeError.value = ''
}
const validateStep1Code = () => {
  if (verifyCode.value && !isStep1CodeValid.value) {
    step1CodeError.value = t('auth.errors.codeInvalid')
  } else {
    step1CodeError.value = ''
  }
}

const clearNewAccountError = () => {
  step2AccountError.value = ''
}
const validateNewAccount = () => {
  if (!newAccount.value) {
    step2AccountError.value = ''
    return
  }
  if (!isNewAccountValid.value) {
    step2AccountError.value =
      props.type === 'phone' ? t('auth.errors.phoneInvalid') : t('auth.errors.emailInvalid')
  } else {
    step2AccountError.value = ''
  }
}

const clearNewCodeError = () => {
  step2CodeError.value = ''
}
const validateNewCode = () => {
  if (newCode.value && !isNewCodeValid.value) {
    step2CodeError.value = t('auth.errors.codeInvalid')
  } else {
    step2CodeError.value = ''
  }
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      resetState()
    } else {
      clearCountdown()
      clearNewCountdown()
    }
  }
)
</script>

<style scoped lang="scss">
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
.dialog-content {
  position: relative;
  background: #fff;
  border-radius: 12px;
  width: 400px;
  padding: 24px;
}
.btn-close {
  position: absolute;
  right: 22px;
  border: none;
  background: transparent;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}
.menu-svg {
  width: 18px;
  height: 18px;
}
.dialog-title {
  display: flex;
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 12px;
  text-align: left;
  padding-right: 28px;
}
.step-desc {
  font-size: 14px;
  margin-bottom: 18px;
  text-align: left;
}

.form-item {
  display: flex;
  gap: 8px;
  input {
    flex: 1;
    height: 40px;
    border: 1px solid #ddd;
    border-radius: 6px;
    padding: 0 12px;
    font-size: 14px;
    &:focus {
      border-color: #0075ff;
      outline: none;
    }
  }
}

.form-item.step1-code-item,
.form-item.step2-code-item {
  display: block;
}

.input-wrapper {
  position: relative;
  width: 100%;
  height: 40px;
}

.input-wrapper input {
  width: 100%;
  height: 100%;
  padding-right: 108px;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding-left: 12px;
  font-size: 14px;
  box-sizing: border-box;
}

.btn-send-inline {
  position: absolute;
  top: 1px;
  right: 1px;
  left: auto;
  bottom: 1px;
  margin-right: 5px;
  margin-left: auto;
  background: #fff;
  border: none;
  border-radius: 0 6px 6px 0;
  font-size: 14px;
  color: #0075ff;
  cursor: pointer;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  transition: background-color 0.2s;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}

.error-message {
  height: 20px;
  color: #ff4d4f;
  font-size: 12px;
  text-align: left;
  margin-top: 0;
}

.dialog-actions {
  justify-content: center;
  margin-top: 15px;
  button {
    width: 400px;
    padding: 12px;
    border-radius: 6px;
    font-size: 14px;
    border: none;
  }
  .btn-confirm {
    background: #0075ff;
    color: #fff;
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}
</style>