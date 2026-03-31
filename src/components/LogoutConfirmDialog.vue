<template>
    <div v-if="visible" class="dialog-overlay">
      <div class="confirm-dialog">
        <h3 class="dialog-title">{{ $t('layout.settings.accountSafety.logoutConfirm.title') }}</h3>
        <p class="confirm-question">{{ $t('layout.settings.accountSafety.logoutConfirm.message') }}</p>
        <div class="dialog-actions">
          <button class="btn-cancel" @click="handleClose">
            {{ $t('layout.settings.accountSafety.logoutConfirm.cancel') }}
          </button>
          <button class="btn-confirm" @click="handleConfirm">
            {{ $t('layout.settings.accountSafety.logoutConfirm.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  defineProps<{
    visible: boolean
  }>()
  
  const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
    (e: 'confirm'): void
  }>()
  
  const handleClose = () => {
    emit('update:visible', false)
  }
  
  const handleConfirm = () => {
    emit('confirm')
    // 不自动关闭，由父组件在确认操作完成后关闭弹窗
  }
  </script>
  
  <style scoped>
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
    font-weight: 700;
    margin-bottom: 26px;
    text-align: left;
  }
  .confirm-question {
    font-size: 14px;
    text-align: left;
    white-space: pre-line; 
    margin-bottom: 24px;
  }
  .dialog-actions {
    display: flex;
    justify-content: end;
    gap: 14px;
  }
  .dialog-actions button {
    padding: 5px 20px;
    border-radius: 6px;
    font-size: 16px;
    cursor: pointer;
  }
  .btn-cancel {
    background-color: #fff;
    border: 1px solid rgba(151, 151, 151, 0.6);
  }
  .btn-confirm {
    background: rgba(254, 83, 72, 1);
    color: #fff;
    border: none;
  }
  </style>