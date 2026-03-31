<template>
  <article class="addon-card">
    <div class="addon-minutes">{{ addonTitleText }}</div>
    <div class="addon-price">{{ currencySymbol }}{{ amountDisplay }}</div>
    <div class="addon-footer">
      <div class="addon-unit">{{ unitText }}</div>
      <button class="addon-action" type="button" :disabled="isPaying" @click="$emit('checkout')">
        <span v-if="isPaying">{{ t('layout.membership.subscriptionPlans.loading') }}</span>
        <span v-else>{{ t('layout.membership.moreTranscriptionTime.buy') }}</span>
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
/**
 * 单张加购卡：时长、价格、单价文案、购买按钮。标题与单价逻辑见 §七。
 */
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps<{
  addonTitleText: string
  currencySymbol: string
  amountDisplay: string
  unitText: string
  isPaying: boolean
}>()

defineEmits<{ (e: 'checkout'): void }>()
</script>

<style lang="scss" scoped>
.addon-card {
  padding: 15px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  box-sizing: border-box;
  transition: all 0.15s ease;

  &:hover {
    border-color: #0075ff;
    box-shadow: 0 2px 8px rgba(0, 117, 255, 0.1);
  }
}

.addon-minutes {
  font-family:
    'PingFang SC',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  font-weight: 500;
  font-size: 16px;
  margin-bottom: 6px;
}

.addon-price {
  font-family:
    'Montserrat',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  font-weight: 700;
  font-size: 24px;
  line-height: 29px;
  margin-bottom: 20px;
}

.addon-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.addon-unit {
  font-family:
    'PingFang SC',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  font-weight: 400;
  font-size: 12px;
  color: #7f7f7f;
  flex: 1;
}

.addon-action {
  width: 57px;
  height: 24px;
  padding: 0;
  background: linear-gradient(to right, #0051ff, #0075ff, #12acff, #24e3ff);
  border: none;
  border-radius: 100px;
  font-family:
    'PingFang SC',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  font-weight: 500;
  font-size: 14px;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    opacity: 0.9;
  }

  &:active:not(:disabled) {
    opacity: 0.8;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
}
</style>
