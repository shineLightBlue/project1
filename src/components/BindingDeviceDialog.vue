<template>
  <el-dialog
    v-model="isDialogVisible"
    :show-close="true"
    width="660px"
    top="3vh"
    @close="closeDialog"
    class="binding-device-dialog"
  >
    <!-- 顶部标题 -->
    <div class="header-section">
      <h2 class="header-title">{{ t('bindingDevice.title') }}</h2>
    </div>

    <div class="body-section">
      <!-- 已有设备 -->
      <div class="binding-device-card">
        <img :src="qrCodeImage" alt="qrcode" class="binding-device-qr-code" />
        <div class="binding-device-card-content">
          <h3 class="binding-device-card-title">{{ t('bindingDevice.existingDevice.title') }}</h3>
          <p class="binding-device-card-description">{{ t('bindingDevice.existingDevice.description') }}</p>
        </div>
      </div>

      <!-- 没有设备 -->
      <div
        class="binding-device-card binding-device-card-with-bg"
        :style="{ backgroundImage: `url(${bgImage})` }"
      >
        <img :src="productImage" alt="product" class="binding-device-product-image" />
        <div class="binding-device-card-content">
          <h3 class="binding-device-card-title">{{ t('bindingDevice.noDevice.title') }}</h3>
          <p class="binding-device-card-description">{{ t('bindingDevice.noDevice.description') }}</p>
          <button type="button" class="binding-device-buy-btn" @click="handleBuyNow">
            {{ t('bindingDevice.planCards.buyNowArrow') }}
          </button>
        </div>
      </div>

      <!-- 升级区域 -->
      <h2 class="binding-device-upgrade-title">{{ t('bindingDevice.upgradeTitle') }}</h2>

      <div class="binding-device-plans-list">
        <!-- 专业版 -->
        <div class="binding-device-plan-card">
          <div class="binding-device-plan-content">
            <div class="binding-device-plan-features">
              <div class="binding-device-plan-feature">
                <span class="binding-device-tick-icon">✓</span>
                <span class="binding-device-plan-feature-text">{{ t('bindingDevice.planCards.professional.feature1') }}</span>
              </div>
              <div class="binding-device-plan-feature">
                <span class="binding-device-tick-icon">✓</span>
                <span class="binding-device-plan-feature-text">{{ t('bindingDevice.planCards.professional.feature2') }}</span>
              </div>
              <div class="binding-device-plan-feature">
                <span class="binding-device-tick-icon">✓</span>
                <span class="binding-device-plan-feature-text">{{ t('bindingDevice.planCards.professional.feature3') }}</span>
              </div>
              <div class="binding-device-plan-feature">
                <span class="binding-device-tick-icon">✓</span>
                <span class="binding-device-plan-feature-text">{{ t('bindingDevice.planCards.professional.feature4') }}</span>
              </div>
              <div class="binding-device-plan-feature">
                <span class="binding-device-tick-icon">✓</span>
                <span class="binding-device-plan-feature-text">{{ t('bindingDevice.planCards.professional.feature5') }}</span>
              </div>
            </div>
            <div class="binding-device-plan-info">
              <div class="binding-device-plan-name">{{ t('bindingDevice.planCards.professional.name') }}</div>
              <div class="binding-device-plan-price">
                ¥339.00 <span class="binding-device-plan-period">{{ t('bindingDevice.planCards.perYear') }}</span>
              </div>
              <el-button
                class="binding-device-plan-subscribe outline"
                :loading="payingProductId === professionalProductId"
                :disabled="!professionalProductId"
                @click="handleSubscribe('professional')"
              >
                {{ t('bindingDevice.planCards.subscribe') }}
              </el-button>
            </div>
          </div>
        </div>

        <!-- 大师版 -->
        <div class="binding-device-plan-card popular">
          <div class="binding-device-plan-badge">{{ t('bindingDevice.planCards.master.badge') }}</div>
          <div class="binding-device-plan-content">
            <div class="binding-device-plan-features">
              <div class="binding-device-plan-feature">
                <span class="binding-device-tick-icon tick-blue">✓</span>
                <span class="binding-device-plan-feature-text">{{ t('bindingDevice.planCards.master.feature1') }}</span>
              </div>
              <div class="binding-device-plan-feature">
                <span class="binding-device-tick-icon tick-blue">✓</span>
                <span class="binding-device-plan-feature-text">{{ t('bindingDevice.planCards.master.feature2') }}</span>
              </div>
              <div class="binding-device-plan-feature">
                <span class="binding-device-tick-icon tick-blue">✓</span>
                <span class="binding-device-plan-feature-text">{{ t('bindingDevice.planCards.master.feature3') }}</span>
              </div>
              <div class="binding-device-plan-feature">
                <span class="binding-device-tick-icon tick-blue">✓</span>
                <span class="binding-device-plan-feature-text">{{ t('bindingDevice.planCards.master.feature4') }}</span>
              </div>
              <div class="binding-device-plan-feature">
                <span class="binding-device-tick-icon tick-blue">✓</span>
                <span class="binding-device-plan-feature-text">{{ t('bindingDevice.planCards.master.feature5') }}</span>
              </div>
            </div>
            <div class="binding-device-plan-info">
              <div class="binding-device-plan-name name-master">{{ t('bindingDevice.planCards.master.name') }}</div>
              <div class="binding-device-plan-price">
                ¥1099.00 <span class="binding-device-plan-period">{{ t('bindingDevice.planCards.perYear') }}</span>
              </div>
              <el-button
                type="primary"
                class="binding-device-plan-subscribe filled"
                :loading="payingProductId === masterProductId"
                :disabled="!masterProductId"
                @click="handleSubscribe('master')"
              >
                {{ t('bindingDevice.planCards.subscribe') }}
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 查看所有套餐 -->
      <div class="binding-device-footer">
        <button type="button" class="binding-device-view-all-link" @click="handleViewAllPlans">
          {{ t('bindingDevice.viewAllPlans') }}
          <img :src="arrowIcon" alt="" class="binding-device-arrow-icon" />
        </button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  apiCreateStripeCheckoutSession,
  apiGetSubscripeProductList,
  apiGetUserCountry,
} from '@/api'
import { useLoginStore } from '@/stores/login'
import arrowIcon from '@/assets/allfiles/icon_binding_device_arrow_black.svg'
import bgImage from '@/assets/allfiles/icon_binding_device_bg.svg'
import qrCodeImage from '@/assets/allfiles/icon_binding_device_qr_code.svg'
import productImage from '@/assets/allfiles/icon_share_url_product_image.png'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible'])
const router = useRouter()
const { t } = useI18n()
const loginStore = useLoginStore()

const isDialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const products = ref<Array<{ productId: string; productName: string; productType: string; amountNumber: number; billingCycle: string }>>([])
const payingProductId = ref('')
const isAboardFlag = ref(true)

function safeStr(v: unknown): string {
  return String(v ?? '').trim()
}
function safeNum(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}
function pickFirstValidText(values: unknown[]): string {
  for (const v of values) {
    const s = String(v ?? '').trim()
    if (s) return s
  }
  return ''
}

// 推断套餐档位
function inferPlanTier(item: { productId: string; productName: string; productType: string; amountNumber: number }): string {
  if (item.productType === '3') return 'addon'
  const text = `${item.productId} ${item.productName}`.toLowerCase()
  if (text.includes('master') || text.includes('大师')) return 'master'
  if (text.includes('pro') || text.includes('professional') || text.includes('专业')) return 'professional'
  if (text.includes('explorer') || text.includes('探索') || item.amountNumber === 0) return 'explorer'
  return 'professional'
}

// 解析产品列表
function normalizeProduct(item: Record<string, any>, fallbackCurrency?: string) {
  const productId = safeStr(item.productId || item.id)
  if (!productId) return null
  const amountText = pickFirstValidText([
    item.price, item.amount, item.payAmount, item.displayPrice,
    item.money, item.totalAmount, item.unitAmount,
  ]) || '0.00'
  const productType = safeStr(item.productType)
  const billingCycle = productType === '0' ? 'annual' : productType === '1' ? 'monthly' : 'unknown'
  return {
    productId,
    productName: safeStr(item.productName || item.name || productId),
    productType,
    amountNumber: safeNum(amountText),
    billingCycle,
  }
}

const professionalProductId = computed(() => {
  const pro = products.value.find(
    (p) => inferPlanTier(p) === 'professional' && p.billingCycle === 'annual'
  )
  return pro?.productId ?? ''
})

const masterProductId = computed(() => {
  const master = products.value.find(
    (p) => inferPlanTier(p) === 'master' && p.billingCycle === 'annual'
  )
  return master?.productId ?? ''
})

async function loadProducts() {
  try {
    const res = await apiGetSubscripeProductList({
      productBuyPlatform: 'web',
      appVersion: '0.4.63',
      availablePlatform: 'WEB',
    })
    const data = (res as any)?.data
    const list = Array.isArray(data)
      ? data
      : Array.isArray((data as any)?.list)
        ? (data as any).list
        : Array.isArray((data as any)?.productList)
          ? (data as any).productList
          : []
    const commonCurrency = pickFirstValidText([
      (res as any)?.currency,
      (data as any)?.currency,
      (data as any)?.currencyCode,
    ])
    console.log(list,'list')
    products.value = list
      .map((item: Record<string, any>) => normalizeProduct(item, commonCurrency))
      .filter(Boolean) as typeof products.value
    console.log(products.value,'products')
  } catch {
    products.value = []
  }
}

async function loadUserCountry() {
  try {
    const res = await apiGetUserCountry()
    const payload = (res as any)?.data ?? {}
    const country = safeStr(payload?.country)
    isAboardFlag.value = country !== '中国'
  } catch {
    isAboardFlag.value = true
  }
}

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      loadProducts()
      loadUserCountry()
    }
  }
)

async function handleSubscribe(planType: 'professional' | 'master') {
  const productId = planType === 'professional' ? professionalProductId.value : masterProductId.value
  const userId = safeStr(loginStore.loginData.userId)
  if (!userId) {
    ElMessage.error(t('layout.membership.payment.error.userNotLoggedIn'))
    return
  }
  if (!productId) {
    ElMessage.error(t('layout.membership.payment.error.productIdRequired'))
    return
  }

  payingProductId.value = productId
  try {
    const origin = window.location.origin
    const successUrl = `${origin}/payment/success?productId=${encodeURIComponent(productId)}&sessionId={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${origin}/payment/failure`
    const res = await apiCreateStripeCheckoutSession({
      userId,
      productId,
      isAboardFlag: isAboardFlag.value,
      successUrl,
      cancelUrl,
    })
    const payload = (res as any)?.data ?? res
    const url = safeStr(payload?.url)
    if (!url) {
      ElMessage.error(t('layout.membership.payment.error.createOrderFailed'))
      return
    }
    window.location.href = url
  } catch (error: any) {
    ElMessage.error(error?.message || t('layout.membership.payment.error.createOrderFailed'))
  } finally {
    payingProductId.value = ''
  }
}

function closeDialog() {
  emit('update:visible', false)
}

function handleBuyNow() {
  window.open('https://www.boyamic.com/product/ai-voice-recorder-boya-notra', '_blank')
}

function handleViewAllPlans() {
  closeDialog()
  router.push('/member')
}
</script>

<style scoped lang="scss">
.header-section {
  text-align: center;
  margin-bottom: 20px;

  .header-title {
    font-size: 22px;
    font-weight: bold;
    color: #333;
    margin: 0;
  }
}

.body-section {
  padding: 0 10px;
}

.binding-device-card {
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.102);
  padding: 20px 30px;
  display: flex;
  align-items: center;
  gap: 80px;
  margin-bottom: 20px;
  box-sizing: border-box;
}

.binding-device-qr-code {
  width: 120px;
  height: 120px;
  flex-shrink: 0;
}

.binding-device-card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.binding-device-card-title {
  font-family: PingFang SC, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif;
  font-weight: 500;
  font-size: 20px;
  line-height: 28px;
  letter-spacing: 0;
  color: #000;
  margin: 0;
  padding: 0;
  text-align: left;
}

.binding-device-card-description {
  font-family: PingFang SC, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif;
  font-weight: 400;
  font-size: 18px;
  line-height: 25px;
  letter-spacing: 0;
  color: #717171;
  margin: 0;
  padding: 0;
  text-align: left;
}

.binding-device-card-with-bg {
  height: 182px;
  background-repeat: no-repeat;
  background-position: top left;
  background-size: cover;
}

.binding-device-product-image {
  width: 120px;
  height: 120px;
  flex-shrink: 0;
  object-fit: contain;
}

.binding-device-buy-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 194px;
  height: 45px;
  margin-top: 0;
  margin-left: 0;
  padding: 0;
  background: linear-gradient(to right, #0051ff, #0075ff, #12acff, #24e3ff);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-family: PingFang SC, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif;
  font-weight: 500;
  font-size: 16px;
  line-height: 22px;
  letter-spacing: 0;
  cursor: pointer;
  transition: opacity 0.2s ease;
  mix-blend-mode: normal;

  &:hover {
    opacity: 0.9;
  }
}

.binding-device-upgrade-title {
  font-family: PingFang SC, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif;
  font-weight: 300;
  font-size: 32px;
  line-height: 45px;
  letter-spacing: 0;
  color: #000;
  margin: 10px 0 20px;
  padding: 0;
  text-align: center;
}

.binding-device-plans-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.binding-device-plan-card {
  height: 182px;
  width: auto;
  box-sizing: border-box;
  border-radius: 6px;
  padding: 20px 30px;
  position: relative;
  border: 1px solid #0000001a;
  transition: border-color 0.2s ease;

  &.popular {
    height: 182px;
    border: none;
    padding: 20px 30px;
    background: linear-gradient(#fff, #fff) padding-box,
      linear-gradient(to right, #0051ff, #0075ff, #12acff, #24e3ff) border-box;
    background-clip: padding-box, border-box;
    border-radius: 6px;
    border: 2px solid transparent;
  }
}

.binding-device-plan-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 70px;
  height: 25px;
  padding: 0;
  background: linear-gradient(to right, #1fd5ff, #14b4ff);
  color: #fff;
  border-radius: 0 6px;
  font-family: PingFang SC, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif;
  font-weight: 500;
  font-size: 12px;
  line-height: 17px;
  letter-spacing: 0;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.binding-device-plan-content {
  display: flex;
  gap: 71px;
  height: 100%;
  align-items: center;
}

.binding-device-plan-features {
  width: 157px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.binding-device-plan-feature {
  display: flex;
  align-items: center;
  gap: 15px;
}

.binding-device-plans-list .binding-device-tick-icon {
  width: 9px;
  display: inline-block;
  flex-shrink: 0;
  color: #000;
  font-size: 12px;
  line-height: 1;

  &.tick-blue {
    color: #0052ff;
  }
}

.binding-device-plan-feature .binding-device-plan-feature-text {
  font-family: PingFang SC, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 1.5;
  color: #000;
}

.binding-device-plan-feature-text {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0;
  line-height: 1.5;
}

.binding-device-plan-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  min-width: 140px;
}

.binding-device-plan-name {
  font-family: PingFang SC, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif;
  font-weight: 500;
  font-size: 20px;
  line-height: 28px;
  letter-spacing: 0;
  text-align: left;
  color: #000;
  margin: 0;
  padding: 0;

  &.name-master {
    color: #0052ff;
  }
}

.binding-device-plan-price {
  font-family: PingFang SC, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif;
  font-weight: 700;
  font-size: 28px;
  line-height: 34px;
  letter-spacing: 0;
  text-align: left;
  color: #000;
  display: flex;
  align-items: center;
  gap: 4px;
}

.binding-device-plan-period {
  font-family: PingFang SC, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 14px;
  letter-spacing: 0;
  text-align: left;
  color: #000;
}

.binding-device-plan-subscribe {
  width: 100px;
  height: 36px;
  border-radius: 6px;
  font-size: 14px;

  &.outline {
    border: 1px solid #ddd;
    color: #333;
    background: #fff;

    &:hover {
      border-color: #0052ff;
      color: #0052ff;
    }
  }

  &.filled {
    background: linear-gradient(90deg, #0052ff 0%, #00dbff 100%);
    border: none;
    color: #fff;
  }
}

.binding-device-footer {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.binding-device-view-all-link {
  display: flex;
  align-items: center;
  gap: 10px;
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  font-family: PingFang SC, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif;
  font-weight: 400;
  font-size: 16px;
  line-height: 22px;
  letter-spacing: 0;
  text-align: center;
  color: #666;
  cursor: pointer;
  transition: color 0.2s ease;

  &:hover {
    color: #0052ff;
  }
}

.binding-device-arrow-icon {
  width: 13px;
  height: auto;
  flex-shrink: 0;
}
</style>

<style lang="scss">
.binding-device-dialog {
  .el-dialog {
    border-radius: 20px;
  }

  .el-dialog__header {
    padding: 0;
    margin: 0;
    height: 0;

    .el-dialog__title {
      display: none;
    }

    .el-dialog__headerbtn {
      top: 16px;
      right: 16px;
      z-index: 10;
    }
  }

  .el-dialog__body {
    max-height: calc(90vh - 10vh);
    overflow-y: auto;
    padding: 30px;
  }
}
</style>
