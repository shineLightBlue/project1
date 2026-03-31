<template>
  <div class="wrap">
    <div class="payment-success-page">
      <header class="payment-success-header">
        <div class="header-brand">
          <img src="@/assets/logo/logo.jpg" alt="N" class="brand-logo" />
          <span class="brand-name">BOYA Notra</span>
        </div>
      </header>

      <main class="payment-success-main">
        <template v-if="status === 'loading'">
          <div class="payment-success-content-wrapper">
            <div class="payment-success-loading">
              <div class="payment-success-loading-spinner"></div>
              <p class="payment-success-loading-text">
                {{ t('layout.membership.subscriptionPlans.loading') }}
              </p>
            </div>
            <section class="payment-success-card is-loading">
              <p class="loading-card-text">
                {{ t('layout.membership.subscriptionPlans.loading') }}
              </p>
            </section>
            <router-link to="/member" class="payment-success-btn payment-success-btn-primary">
              {{ t('layout.membership.paymentSuccess.enterApp') }}
            </router-link>
          </div>
        </template>

        <template v-else>
          <div class="payment-success-content-wrapper">
            <div v-if="tier === 'addon'" style="height: 200px"></div>
            <h1 class="payment-success-title">{{ successTitle }}</h1>
            <section v-if="showBenefitsCard" class="payment-success-card">
              <div class="payment-success-includes">{{ benefitsTitle }}</div>
              <ul class="payment-success-feature-list">
                <li
                  v-for="(item, index) in benefitEntries"
                  :key="index"
                  :class="{ highlight: item.isHighlight }"
                >
                  <span
                    class="payment-success-feature-icon"
                    :class="{ highlight: item.isHighlight }"
                    aria-hidden="true"
                  ></span>
                  {{ item.label }}
                </li>
              </ul>
            </section>
            <router-link to="/member" class="payment-success-btn payment-success-btn-primary">
              {{ t('layout.membership.paymentSuccess.enterApp') }}
            </router-link>
          </div>
        </template>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 支付成功页：根据 URL sessionId 查询 Stripe Checkout Session 状态，展示 loading / 失败 / 成功。
 * 成功时根据 productId 展示对应套餐标题与权益列表（与会员中心权益一致，来自 getProductPrivileges）。
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { apiGetProductPrivileges, apiGetStripeCheckoutSession } from '@/api'
import { privilegeCodeToFeatureKey } from '@/utils/membershipPrivileges'

type PlanTier = 'explorer' | 'professional' | 'master' | 'addon'
type PrivilegeEntry = { code: string; displayValue: string; isHighlight: boolean }
type PrivilegesByTier = Record<Exclude<PlanTier, 'addon'>, PrivilegeEntry[]>

function safeStr(v: unknown): string {
  if (v == null) return ''
  return String(v).trim()
}

function normalizeStatusText(value: unknown): string {
  return safeStr(value).toLowerCase()
}

/** 补充包 productId：不展示专属权益框 */
const ADDON_PRODUCT_IDS = [
  'wm_transcription_120',
  'wm_transcription_600',
  'wm_transcription_3000',
  'wm_transcription_6000',
]

/** 根据 productId 推断套餐档位：ultimate=大师版，pro=专业版，EXPERIENCE_FREE=探索版，wm_transcription_*=补充包 */
function inferTierFromProductId(productId: string): PlanTier {
  const text = productId.toLowerCase()
  if (ADDON_PRODUCT_IDS.includes(productId) || text.startsWith('wm_transcription_')) return 'addon'
  if (text.includes('ultimate') || text.includes('大师')) return 'master'
  if (text.includes('pro') || text.includes('专业')) return 'professional'
  if (productId === 'EXPERIENCE_FREE' || text.includes('explorer') || text.includes('探索'))
    return 'explorer'
  return 'professional'
}

/** 解析 getProductPrivileges 返回的 data：key 1=专业版 2=探索版 3=大师版 */
function parsePrivilegesByTier(payload: any): PrivilegesByTier {
  const empty: PrivilegesByTier = { explorer: [], professional: [], master: [] }
  if (!payload || typeof payload !== 'object') return empty
  const raw = payload as Record<string, unknown>
  const normalizeList = (list: unknown): PrivilegeEntry[] => {
    if (!Array.isArray(list)) return []
    return list
      .map((item: any) => {
        const code = safeStr(item?.code)
        if (!code) return null
        const rawHighlight = item?.isHighlight ?? item?.is_highlight
        const isHighlight =
          rawHighlight === true ||
          rawHighlight === 1 ||
          rawHighlight === '1' ||
          rawHighlight === 'true'
        return { code, displayValue: safeStr(item?.displayValue ?? ''), isHighlight }
      })
      .filter(Boolean) as PrivilegeEntry[]
  }
  return {
    professional: normalizeList(raw['1']),
    explorer: normalizeList(raw['2']),
    master: normalizeList(raw['3']),
  }
}

/** 从 checkout session 响应判断是否已支付 / 是否失败 */
function resolveCheckoutState(res: any): { isPaid: boolean; isFailed: boolean } {
  const root = res?.data ?? res ?? {}
  const data = root?.data ?? root
  const statusCandidates = [
    root?.status,
    data?.status,
    data?.sessionStatus,
    data?.checkoutStatus,
  ].map(normalizeStatusText)
  const paymentCandidates = [data?.paymentStatus, data?.payStatus, data?.payment_status].map(
    normalizeStatusText,
  )
  const paidSet = new Set(['success', 'succeeded', 'paid', 'complete'])
  const failedSet = new Set([
    'fail',
    'failed',
    'canceled',
    'cancelled',
    'expired',
    'incomplete_expired',
    'refunded',
  ])
  const hasPaid = [...statusCandidates, ...paymentCandidates].some((s) => paidSet.has(s))
  const hasFailed = [...statusCandidates, ...paymentCandidates].some((s) => failedSet.has(s))
  return { isPaid: !!hasPaid, isFailed: !!hasFailed }
}

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const sessionId = computed(() => safeStr(route.query.sessionId) || safeStr(route.query.session_id))
/** 优先使用 checkout-session 返回的 metadata.productId，否则用 URL 的 productId */
const sessionProductId = ref('')
const productId = computed(() => safeStr(sessionProductId.value) || safeStr(route.query.productId))

const status = ref<'loading' | 'success' | 'failed'>('loading')
const privilegesByTier = ref<PrivilegesByTier>({ explorer: [], professional: [], master: [] })

const tier = computed(() => inferTierFromProductId(productId.value))
const showBenefitsCard = computed(() => tier.value !== 'addon')

const successTitle = computed(() => {
  if (tier.value === 'professional') return t('layout.membership.paymentSuccess.titleProfessional')
  if (tier.value === 'master') return t('layout.membership.paymentSuccess.title')
  if (tier.value === 'explorer') {
    const masterTitle = t('layout.membership.paymentSuccess.title')
    const masterName = t('layout.membership.subscriptionPlans.master.name')
    const explorerName = t('layout.membership.subscriptionPlans.explorer.name')
    return masterTitle.replace(masterName, explorerName)
  }
  if (tier.value === 'addon') return t('layout.membership.paymentSuccess.purchaseSuccess')
  return t('layout.membership.paymentSuccess.titleProfessional')
})

const benefitsTitle = computed(() => {
  if (tier.value === 'professional')
    return t('layout.membership.paymentSuccess.benefitsTitleProfessional')
  if (tier.value === 'master') return t('layout.membership.paymentSuccess.benefitsTitle')
  if (tier.value === 'explorer')
    return (
      t('layout.membership.subscriptionPlans.includes') +
      t('layout.membership.subscriptionPlans.explorer.name')
    )
  return t('layout.membership.paymentSuccess.benefitsTitleProfessional')
})

const benefitEntries = computed(() => {
  if (tier.value === 'addon') return []
  const list = privilegesByTier.value[tier.value] || []
  const tierKey = tier.value
  const result: { label: string; isHighlight: boolean }[] = []
  const seen = new Set<string>()
  for (const entry of list) {
    const featureKey = privilegeCodeToFeatureKey[entry.code] || entry.code
    const i18nKey = `layout.membership.subscriptionPlans.${tierKey}.features.${featureKey}`
    const label = t(i18nKey, { value: entry.displayValue })
    if (seen.has(label)) continue
    seen.add(label)
    result.push({ label, isHighlight: entry.isHighlight === true })
  }
  return result
})

let pollTimer: ReturnType<typeof setInterval> | null = null
const POLL_INTERVAL_MS = 500
const POLL_MAX_ATTEMPTS = 3
let pollAttempts = 0

/** 加载按档位分组的权益，用于成功态权益列表展示 */
async function loadPrivileges() {
  try {
    const res = (await apiGetProductPrivileges({})) as any
    const data = res?.data ?? res
    privilegesByTier.value = parsePrivilegesByTier(data)
  } catch {
    privilegesByTier.value = { explorer: [], professional: [], master: [] }
  }
}

/** 查询 checkout session：取 metadata.productId，并根据支付状态置 success/failed */
async function queryCheckoutSession(): Promise<boolean> {
  if (!sessionId.value) return true
  try {
    const res = (await apiGetStripeCheckoutSession({ sessionId: sessionId.value }, false)) as any
    const data = res?.data ?? res ?? {}
    const meta = data?.metadata
    if (meta && typeof meta === 'object' && safeStr(meta.productId)) {
      sessionProductId.value = safeStr(meta.productId)
    }
    const state = resolveCheckoutState(res)
    if (state.isPaid) return true
    if (state.isFailed) {
      stopPolling()
      router.push('/payment/failure')
      return false
    }
    return false
  } catch (error) {
    console.error('查询支付会话状态失败，将重试:', error)
    return false
  }
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

/** 轮询一次 session 状态，超次数则置为 failed */
async function tick() {
  pollAttempts += 1
  if (pollAttempts > POLL_MAX_ATTEMPTS) {
    stopPolling()
    router.push('/payment/failure')
    return
  }
  const done = await queryCheckoutSession()
  if (done) {
    stopPolling()
    await loadPrivileges()
    status.value = 'success'
  }
}

onMounted(async () => {
  await loadPrivileges()
  if (!sessionId.value) {
    status.value = 'success'
    return
  }
  const done = await queryCheckoutSession()
  if (done) {
    status.value = 'success'
    return
  }
  pollTimer = setInterval(tick, POLL_INTERVAL_MS)
})

onBeforeUnmount(() => {
  stopPolling()
})
</script>

<style scoped lang="scss">
.wrap {
  height: 100vh;
  overflow-y: scroll;
}

@keyframes payment-success-loading-spin {
  to {
    transform: rotate(360deg);
  }
}

.payment-success-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #fff;
  padding-bottom: 180px;
  box-sizing: border-box;
  font-family:
    'PingFang SC',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
}

.payment-success-header {
  padding: 30px 30px 114px;
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

.payment-success-main {
  flex: 1;
  box-sizing: border-box;
}

.payment-success-content-wrapper {
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
  text-align: center;
}

.payment-success-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 32px;
}

.payment-success-card.is-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 255px;
}

.loading-card-text {
  font-size: 16px;
  color: #b0b0b0;
}

.payment-success-loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 81, 255, 0.2);
  border-top-color: #0051ff;
  border-radius: 50%;
  animation: payment-success-loading-spin 0.8s linear infinite;
}

.payment-success-loading-text {
  margin-top: 16px;
  font-size: 16px;
  color: #666;
}

.payment-success-title {
  font-family:
    'PingFang SC',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  font-weight: 400;
  font-size: 32px;
  margin: 0 0 30px;
  padding: 0;
}

.payment-success-card {
  position: relative;
  padding: 30px;
  margin-bottom: 86px;
  border: 2px solid transparent;
  border-radius: 6px;
  box-sizing: border-box;
  background-image:
    linear-gradient(to top, #bceefd, #f5fafe 15%, #ffffff 45%),
    linear-gradient(to right, #0051ff, #0075ff, #12acff, #24e3ff);
  background-origin: border-box;
  background-clip: padding-box, border-box;
  box-shadow: 0 4px 12px rgba(0, 117, 255, 0.15);
  text-align: left;
}

.payment-success-includes {
  font-family:
    'PingFang SC',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  font-weight: 700;
  font-size: 18px;
  color: #1a1a1a;
  margin: 0 0 20px;
  padding: 0;
  display: inline-block;
  width: fit-content;
  background: linear-gradient(to right, #0051ff, #0075ff, #12acff, #24e3ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  color: transparent;
}

.payment-success-feature-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.payment-success-feature-list li {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-family:
    'PingFang SC',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  font-weight: 400;
  font-size: 18px;
  color: #000000;
  margin-bottom: 20px;
}

.payment-success-feature-list li:last-child {
  margin-bottom: 0;
}

.payment-success-feature-list li.highlight {
  font-weight: 500;
  color: #0075ff;
}

.payment-success-feature-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  margin-top: 2px;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 17.8286 12.8286' xmlns='http://www.w3.org/2000/svg' fill='none'%3E%3Cpath d='M1.41431 6.41431L6.41431 11.4143L16.4143 1.41431' stroke='%230075FF' stroke-linecap='square' stroke-width='2'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-size: contain;
  background-position: center;
  display: inline-block;
}

.payment-success-feature-icon.highlight {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 17.8286 12.8286' xmlns='http://www.w3.org/2000/svg' fill='none'%3E%3Cpath d='M1.41431 6.41431L6.41431 11.4143L16.4143 1.41431' stroke='%230075FF' stroke-linecap='square' stroke-width='2'/%3E%3C/svg%3E");
}

.payment-success-btn {
  display: block;
  width: 100%;
  max-width: 380px;
  margin: 0 auto;
  padding: 14px 24px;
  font-size: 20px;
  font-weight: 600;
  text-align: center;
  text-decoration: none;
  color: #fff;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  background: #007bff;
  box-sizing: border-box;
}

.payment-success-btn-primary {
  background: linear-gradient(to right, #6ee0ff, #0051ff);
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.25);
}

.payment-success-btn:hover {
  opacity: 0.95;
}
</style>
