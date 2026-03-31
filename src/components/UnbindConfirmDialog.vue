<template>
    <div v-if="visible" class="dialog-overlay" >
      <div class="unbind-dialog">
        <div style="display: flex;">
          <h3 class="dialog-title">{{ t('layout.settings.accountSafety.unbindThirdAccountConfirm.title') }}</h3>
          <img class="cancel" src="@/assets/images/icon_cancel.svg" @click="handleClose"/>
        </div>
        <p class="dialog-message">
          {{ messageText }}
        </p>
        <div class="dialog-actions">
          <button class="btn-cancel" @click="handleClose">
            {{ t('layout.settings.accountSafety.unbindThirdAccountConfirm.cancel') }}
          </button>
          <button class="btn-confirm" @click="handleConfirm">
            {{ t('layout.settings.accountSafety.unbindThirdAccountConfirm.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  
  const { t } = useI18n()
  
  const props = defineProps<{
    visible: boolean
    accountType: 'wechat' | 'google' | 'apple'
  }>()
  
  const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
    (e: 'confirm'): void
  }>()
  
  // 获取对应账号类型的本地化名称
  const accountTypeName = computed(() => {
    const key = `layout.settings.accountSafety.loginMethods.thirdAccountTypes.${props.accountType}`
    return t(key)
  })
  
  // 构建弹窗消息
  const messageText = computed(() => {
    // 优先使用带参数的 message
    return t('layout.settings.accountSafety.unbindThirdAccountConfirm.message', {
      type: accountTypeName.value
    })
  })
  
  const handleClose = () => {
    emit('update:visible', false)
  }
  
  const handleConfirm = () => {
    emit('confirm')
    handleClose()
  }
  </script>
  
  <style lang="scss" scoped>
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
  
  .unbind-dialog {
    background: #fff;
    border-radius: 12px;
    width: 360px;
    padding: 24px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  }
  
  .dialog-title {
    font-size: 18px;
    font-weight: 600;
    color: #1e1e1e;
    margin: 0 0 28px 0;
    text-align: left;
  }

  .cancel{
    margin: auto 5px 30px auto;
  }

  .dialog-message {
    font-size: 14px;
    line-height: 1.5;
    margin: 0 0 32px 0;
    text-align: left;
  }
  
  .dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  
    button {
      padding: 7px 24px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: background-color 0.2s;
    }
  
    .btn-cancel {
      background: #ffffff;
      border: 1px solid rgba(151, 151, 151, 0.5);
      color: #1e1e1e;
  
      &:hover {
        background: #e8e8e8;
      }
    }
  
    .btn-confirm {
      background: rgba(0, 117, 255, 1);
      color: #fff;
  
      &:hover {
        background: rgba(0, 117, 255, 0.8);
      }
    }
  }
  </style>