<template>
  <div class="payment-failure-page">
    <header class="payment-failure-header">
      <div class="header-brand">
        <img src="@/assets/logo/logo.jpg" alt="N" class="brand-logo" />
        <span class="brand-name">BOYA Notra</span>
      </div>
    </header>

    <main class="payment-failure-main">
      <div class="failure-content">
        <img src="@/assets/images/icon_pay_failure.svg" alt="Payment Failed" class="failure-icon" />
        <h1 class="failure-title">{{ t('layout.membership.paymentFailure.title') }}</h1>
        <p class="failure-subtitle">{{ t('layout.membership.paymentFailure.subtitle') }}</p>
        <router-link to="/member" class="failure-btn"
          >{{ t('layout.membership.paymentFailure.returnToCheckout') }}
        </router-link>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style scoped lang="scss">
.payment-failure-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #fff;
  font-family:
    'PingFang SC',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
}

.payment-failure-header {
  padding: 30px 30px 0;
  flex-shrink: 0;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 25px;
}

.brand-logo {
  width: 50px;
  border-radius: 6px;
  object-fit: contain;
}

.brand-name {
  font-weight: 600;
  font-size: 35px;
}

.payment-failure-main {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
  box-sizing: border-box;
  width: 100%;
}

.failure-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 560px;
  margin: 0 auto;
}

.failure-icon {
  width: 232px;
  height: 153px;
  margin-bottom: 25px;
}

.failure-title {
  font-weight: 500;
  font-size: 32px;
  margin: 0 0 12px;
}

.failure-subtitle {
  font-size: 22px;
  color: #7f7f7f;
  margin: 0 0 224px;
}

.failure-btn {
  display: block;
  width: 380px;
  height: 60px;
  line-height: 60px;
  padding: 0;
  font-size: 20px;
  font-weight: 500;
  text-align: center;
  text-decoration: none;
  color: #fff;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  background: linear-gradient(to right, #24e3ff, #0051ff);
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.25);
  box-sizing: border-box;
}

.failure-btn:hover {
  opacity: 0.95;
}
</style>
