<template>
  <section class="settings-membership" v-loading="loading">
    <h2 class="settings-membership-section-title">
      {{ t('layout.settings.membershipContent.currentPlan') }}
    </h2>
    <div class="settings-membership-card">
      <div class="settings-membership-card-header">
        <div class="settings-membership-plan">{{ currentPlanName }}</div>
        <!-- 取消订阅 -->
        <button
          v-if="canCancel"
          class="settings-membership-cancel-btn"
          @click="showCancelModal = true"
        >
          {{ t('layout.settings.membershipContent.cancelSubscription') }}
        </button>
      </div>

      <div class="settings-membership-card-divider"></div>

      <h3 class="settings-membership-card-subtitle">
        {{ t('layout.settings.membershipContent.transcriptionDuration') }}
      </h3>
      <div class="settings-membership-progress-track">
        <div class="settings-membership-progress-fill" :style="{ width: `${usagePercent}%` }" />
      </div>
      <div class="settings-membership-usage-text" v-if="!isUnlimitedPlan">
        {{
          t('layout.settings.membershipContent.remaining', {
            remaining: remainingMinutes,
            total: totalMinutes,
          })
        }}
      </div>
      <div class="settings-membership-usage-text" v-else>
        {{ t('layout.settings.membershipContent.remainingUnlimited', { remaining: usedMinutes }) }}
      </div>

      <div v-if="showExpiry" class="settings-membership-date-section">
        <div class="settings-membership-date-row">
          {{
            t('layout.settings.membershipContent.nextResetDate', { date: nextResetDateText || '-' })
          }}
        </div>
        <div class="settings-membership-date-row">
          {{
            t('layout.settings.membershipContent.nextPaymentDate', {
              date: nextPaymentDateText || '-',
            })
          }}
        </div>
      </div>
    </div>

    <div class="settings-membership-entries">
      <div class="settings-membership-entry" @click="showPurchaseModal = true">
        <span>{{ t('layout.settings.membershipContent.purchaseHistory') }}</span>
        <img src="@/assets/images/icon-arrow-record.svg" alt="" />
      </div>
      <div class="settings-membership-entry" @click="showTranscriptionModal = true">
        <span>{{ t('layout.settings.membershipContent.transcriptionHistory') }}</span>
        <img src="@/assets/images/icon-arrow-record.svg" alt="" />
      </div>
    </div>

    <!-- 购买记录 -->
    <el-dialog
      class="buy-record"
      v-model="showPurchaseModal"
      :title="t('layout.settings.membershipContent.purchaseHistory')"
      width="830px"
      destroy-on-close
      @opened="loadPurchaseLogs"
    >
      <div v-loading="purchaseLoading" class="settings-membership-modal-body">
        <p v-if="purchaseError" class="settings-membership-error">
          {{ t('layout.settings.membershipContent.purchaseHistoryError') }}
        </p>
        <table v-else class="settings-membership-table">
          <thead>
            <tr>
              <th>{{ t('layout.settings.membershipContent.purchaseHistoryTable.product') }}</th>
              <th>{{ t('layout.settings.membershipContent.purchaseHistoryTable.paymentTime') }}</th>
              <th>
                {{ t('layout.settings.membershipContent.purchaseHistoryTable.actualPayment') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in purchaseList" :key="i">
              <td>{{ row.productName || row.productId || '-' }}</td>
              <td>{{ formatPaymentTime(row.buyDate || row.createTime) }}</td>
              <td>{{ formatPaymentAmount(row.payAmount ?? row.amount) }}</td>
            </tr>
            <tr v-if="!purchaseLoading && !purchaseError && purchaseList.length === 0">
              <td colspan="3" class="settings-membership-empty">
                {{ t('layout.settings.membershipContent.purchaseHistoryLoadComplete') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </el-dialog>

    <!-- 转写记录 -->
    <el-dialog
      class="buy-record"
      v-model="showTranscriptionModal"
      :title="t('layout.settings.membershipContent.transcriptionHistory')"
      width="830px"
      destroy-on-close
      @opened="loadRecordLogs"
    >
      <div v-loading="transcriptionLoading" class="settings-membership-modal-body">
        <p v-if="transcriptionError" class="settings-membership-error">
          {{ t('layout.settings.membershipContent.transcriptionHistoryError') }}
        </p>
        <table v-else class="settings-membership-table">
          <thead>
            <tr>
              <th style="width: 280px; box-sizing: border-box">
                {{ t('layout.settings.membershipContent.transcriptionHistoryTable.product') }}
              </th>
              <th>
                {{
                  t('layout.settings.membershipContent.transcriptionHistoryTable.transcriptionTime')
                }}
              </th>
              <th>
                {{ t('layout.settings.membershipContent.transcriptionHistoryTable.consumedQuota') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in recordList" :key="i">
              <td>
                {{
                  row.functionName ||
                  t('layout.settings.membershipContent.transcriptionHistoryData.aiSummary')
                }}
              </td>
              <td>{{ formatRecordTime(row.useDate || row.createTime || row.buyDate) }}</td>
              <td>
                {{
                  formatConsumedMinSec(
                    row.timeCount ?? row.value ?? row.duration ?? row.consumeAmount,
                  )
                }}
              </td>
            </tr>
            <tr v-if="!transcriptionLoading && !transcriptionError && recordList.length === 0">
              <td colspan="3" class="settings-membership-empty">
                {{ t('layout.settings.membershipContent.transcriptionHistoryEmpty') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </el-dialog>
    <!-- 取消订阅弹层 -->
    <el-dialog
      v-model="showCancelModal"
      class="cancel-dialog"
      :title="t('layout.settings.membershipContent.cancelSubscription')"
      width="600px"
      destroy-on-close
    >
      <div class="settings-membership-cancel-modal">
        <!-- 描述文本 -->
        <p class="settings-membership-cancel-description">
          {{
            t('layout.settings.membershipContent.cancelSubscriptionDescription1', {
              date: cancelDateText,
            })
          }}{{ t('layout.settings.membershipContent.cancelSubscriptionDescription2') }}
        </p>

        <!-- 权益列表（动态来自 API，与 /member 和 /payment/success 一致） -->
        <ul class="settings-membership-cancel-benefits">
          <li
            v-for="(entry, index) in cancelBenefitEntries"
            :key="index"
            class="settings-membership-cancel-benefit-item"
            :class="{ highlight: entry.isHighlight }"
          >
            <img src="@/assets/images/icon-member-select.svg" alt="" />
            <span>{{ entry.label }}</span>
          </li>
        </ul>

        <!-- 原因下拉 -->
        <el-select
          popper-class="reason-select"
          v-model="selectedCancelReason"
          :placeholder="t('layout.settings.membershipContent.cancelSubscriptionReasonPlaceholder')"
          class="settings-membership-cancel-select"
        >
          <el-option
            v-for="opt in cancelReasonOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>

        <!-- 底部按钮 -->
        <div class="settings-membership-cancel-modal-footer">
          <el-button
            class="settings-membership-cancel-confirm-btn cancel-btn"
            @click="handleCancelSubscription"
          >
            {{ t('layout.settings.membershipContent.cancelSubscription') }}
          </el-button>
          <el-button type="primary" @click="showCancelModal = false" class="confirm-btn">
            {{ t('layout.settings.membershipContent.keepSubscription') }}
          </el-button>
        </div>
      </div>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
/**
 * 设置-会员页：当前套餐名称、转写用量与进度、下次重置/付款日；购买记录与转写记录弹层；取消 Stripe 订阅。
 * 数据来源：apiQuerySubscripeByUserId、apiGetAppUserInfo、apiGetProductPrivileges、apiGetSubscripeProductList 等。
 */
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import {
  apiCancelStripeSubscription,
  apiGetAppUserInfo,
  apiGetProductPrivileges,
  apiGetSubscripeProductList,
  apiGetUserBindDeviceList,
  apiQueryBuyLogByUserId,
  apiQueryRecordLogByUserId,
  apiQuerySubscripeByUserId,
} from '@/api'
import { useLoginStore } from '@/stores/login'
import { privilegeCodeToFeatureKey } from '@/utils/membershipPrivileges'

type BillingCycle = 'monthly' | 'annual' | 'unknown'
type PlanTier = 'explorer' | 'professional' | 'master' | 'addon'
type PrivilegeEntry = { code: string; displayValue: string; isHighlight: boolean }
type PrivilegesByTier = Record<Exclude<PlanTier, 'addon'>, PrivilegeEntry[]>

type SubscriptionPayload = {
  productId?: string
  effectiveDate?: string
  nextPayDate?: string
  useRecordRead?: string | number
  resetRecordNum?: string | number
  memberType?: string
  stripeSubCancelable?: boolean
  autoPayFlag?: string
}

/** getAppUserInfo 返回：memberType 1=探索版 2=专业版包月 3=专业版包年 4=大师版包月 5=大师版包年 */
type AppUserInfoPayload = {
  useRecordRead?: string | number
  totalRecordRead?: string | number
  resetRecordNum?: string | number
  memberType?: string
  effictiveEndTime?: string
  resetPermissionTime?: string
}

type SubscriptionProduct = {
  productId: string
  productName: string
  productType: string
  amountNumber: number
  raw: Record<string, any>
}

const currencySymbolMap: Record<string, string> = {
  CNY: '¥',
  USD: '$',
  JPY: '¥',
  HKD: 'HK$',
  TWD: 'NT$',
  GBP: '£',
  AUD: 'A$',
  EUR: '€',
}

function safeStr(v: unknown): string {
  return String(v ?? '').trim()
}

function safeNum(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function pickFirstValidText(values: unknown[]): string {
  for (const v of values) {
    const s = safeStr(v)
    if (s) return s
  }
  return ''
}

function resolveCurrencySymbol(item: Record<string, any>, fallback?: string): string {
  const direct = pickFirstValidText([item.currencySymbol, item.currencySign, item.symbol])
  if (direct) return direct
  const code = pickFirstValidText([item.currency, item.currencyCode, fallback]).toUpperCase()
  return currencySymbolMap[code] || '¥'
}

function resolveAmount(item: Record<string, any>): string {
  return (
    pickFirstValidText([
      item.price,
      item.amount,
      item.payAmount,
      item.productPrice,
      item.currentPrice,
    ]) || '0.00'
  )
}

function resolveBillingCycle(item: Record<string, any>): BillingCycle {
  const pt = safeStr(item.productType)
  if (pt === '0') return 'annual'
  if (pt === '1') return 'monthly'
  return 'unknown'
}

function normalizeProduct(
  item: Record<string, any>,
  fallbackCurrency?: string,
): SubscriptionProduct | null {
  const productId = safeStr(item.productId || item.id)
  if (!productId) return null
  const amountText = resolveAmount(item)
  return {
    productId,
    productName: safeStr(item.productName || item.name || productId),
    productType: safeStr(item.productType),
    amountNumber: safeNum(amountText),
    raw: item,
  }
}

function inferPlanTier(item: SubscriptionProduct): PlanTier {
  if (item.productType === '3') return 'addon'
  const text = `${item.productId} ${item.productName}`.toLowerCase()
  if (text.includes('master') || text.includes('大师')) return 'master'
  if (text.includes('pro') || text.includes('professional') || text.includes('专业'))
    return 'professional'
  if (text.includes('explorer') || text.includes('探索') || item.amountNumber === 0)
    return 'explorer'
  return 'professional'
}

function normalizeDateText(value: unknown): string {
  const s = safeStr(value)
  if (!s) return ''
  const date = new Date(s)
  if (Number.isNaN(date.getTime())) return s
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const { t } = useI18n()
const loginStore = useLoginStore()

const loading = ref(true)
const subscription = ref<SubscriptionPayload | null>(null)
const appUserInfo = ref<AppUserInfoPayload | null>(null)
const products = ref<SubscriptionProduct[]>([])
const bindDevices = ref<any[]>([])
const privilegesByTier = ref<PrivilegesByTier>({ explorer: [], professional: [], master: [] })

/** 会员套餐：memberType 1=探索版 2=专业版包月 3=专业版包年 4=大师版包月 5=大师版包年，带连续包月/包年文案 */
const canCancel = computed(
  () =>
    subscription.value?.stripeSubCancelable === true && subscription.value?.autoPayFlag === 'yes',
)

const currentPlanName = computed(() => {
  const mt = safeStr(appUserInfo.value?.memberType ?? subscription.value?.memberType)
  if (mt === '2')
    return `${t('layout.membership.subscriptionPlans.professional.name')}-${t('layout.membership.payment.monthlySubscription')}`
  if (mt === '3')
    return `${t('layout.membership.subscriptionPlans.professional.name')}-${t('layout.membership.payment.annualSubscription')}`
  if (mt === '4')
    return `${t('layout.membership.subscriptionPlans.master.name')}-${t('layout.membership.payment.monthlySubscription')}`
  if (mt === '5')
    return `${t('layout.membership.subscriptionPlans.master.name')}-${t('layout.membership.payment.annualSubscription')}`
  if (mt === '1') return t('layout.membership.subscriptionPlans.explorer.name')
  const devices = bindDevices.value
  if (devices.length === 0) return t('layout.membership.memberType.notMember')
  const productId = safeStr(subscription.value?.productId)
  if (!productId) return t('layout.membership.subscriptionPlans.explorer.name')
  const matched = products.value.find((p) => p.productId === productId)
  if (!matched) return t('layout.membership.subscriptionPlans.explorer.name')
  const tier = inferPlanTier(matched)
  if (tier === 'explorer') return t('layout.membership.subscriptionPlans.explorer.name')
  if (tier === 'professional') return t('layout.membership.subscriptionPlans.professional.name')
  if (tier === 'master') return t('layout.membership.subscriptionPlans.master.name')
  return matched.productName || productId
})

const usedMinutes = computed(() => {
  const used = appUserInfo.value?.useRecordRead ?? subscription.value?.useRecordRead
  const n = safeNum(used)
  return Math.floor(n)
})
const totalMinutes = computed(() => {
  const total =
    appUserInfo.value?.totalRecordRead ??
    appUserInfo.value?.resetRecordNum ??
    subscription.value?.resetRecordNum
  const n = safeNum(total)
  return Math.floor(n)
})
const remainingMinutes = computed(() => Math.max(0, totalMinutes.value - usedMinutes.value))
const isUnlimitedPlan = computed(() => {
  const mt = safeStr(appUserInfo.value?.memberType ?? subscription.value?.memberType)
  const total =
    appUserInfo.value?.totalRecordRead ??
    appUserInfo.value?.resetRecordNum ??
    subscription.value?.resetRecordNum
  return total === -1 || mt === '4' || mt === '5'
})
const usagePercent = computed(() => {
  if (isUnlimitedPlan.value) return 0
  const total = totalMinutes.value
  if (!total) return 0
  return Math.max(0, Math.min(100, Math.floor((usedMinutes.value / total) * 100)))
})

/** 到期区域：memberType 2/3/4/5 时显示，日期来自 getAppUserInfo.effictiveEndTime、resetPermissionTime */
const showExpiry = computed(() => {
  const mt = safeStr(appUserInfo.value?.memberType ?? subscription.value?.memberType)
  return mt === '2' || mt === '3' || mt === '4' || mt === '5'
})

const effectiveDateText = computed(() => normalizeDateText(subscription.value?.effectiveDate))
const effectiveEndDateText = computed(() => normalizeDateText(appUserInfo.value?.effictiveEndTime))
const nextPayDateText = computed(() =>
  normalizeDateText(appUserInfo.value?.effictiveEndTime ?? subscription.value?.nextPayDate),
)
const nextResetDateText = computed(() => normalizeDateText(appUserInfo.value?.resetPermissionTime))
const nextPaymentDateText = computed(() => normalizeDateText(appUserInfo.value?.effictiveEndTime))
const startEndDateParams = computed(() => ({
  start: effectiveDateText.value,
  end: effectiveEndDateText.value || nextPayDateText.value,
}))
const startEndDateText = computed(
  () =>
    (effectiveDateText.value && (effectiveEndDateText.value || nextPayDateText.value)) ||
    effectiveEndDateText.value ||
    nextPayDateText.value,
)

/** 解析 getProductPrivileges 返回 data：key 1=专业版 2=探索版 3=大师版 */
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

/** 取消订阅弹层中展示的权益列表：动态来自 API（getProductPrivileges），与 /member 和 /payment/success 使用同一套 code→i18n 映射 */
const cancelBenefitEntries = computed(() => {
  const mt = safeStr(appUserInfo.value?.memberType ?? subscription.value?.memberType)
  let tier: Exclude<PlanTier, 'addon'>
  if (mt === '4' || mt === '5') tier = 'master'
  else if (mt === '2' || mt === '3') tier = 'professional'
  else tier = 'professional' // 默认展示专业版权益
  const entries = privilegesByTier.value[tier] || []
  const seen = new Set<string>()
  const result: { label: string; isHighlight: boolean }[] = []
  for (const entry of entries) {
    const featureKey = privilegeCodeToFeatureKey[entry.code] || entry.code
    const i18nKey = `layout.membership.subscriptionPlans.${tier}.features.${featureKey}`
    const label = t(i18nKey, { value: entry.displayValue })
    if (seen.has(label)) continue
    seen.add(label)
    result.push({ label, isHighlight: entry.isHighlight === true })
  }
  return result
})

const cancelReasonOptions = computed(() => [
  {
    value: 'notUsing',
    label: t('layout.settings.membershipContent.cancelSubscriptionReasons.notUsing'),
  },
  { value: 'price', label: t('layout.settings.membershipContent.cancelSubscriptionReasons.price') },
  {
    value: 'foundAlternative',
    label: t('layout.settings.membershipContent.cancelSubscriptionReasons.foundAlternative'),
  },
  {
    value: 'tooExpensive',
    label: t('layout.settings.membershipContent.cancelSubscriptionReasons.tooExpensive'),
  },
  { value: 'other', label: t('layout.settings.membershipContent.cancelSubscriptionReasons.other') },
])

const cancelDateText = computed(() =>
  normalizeDateText(subscription.value?.nextPayDate ?? appUserInfo.value?.effictiveEndTime),
)

// ─── 取消订阅弹层 ─────────────────────────────────────────────────────────────
const showCancelModal = ref(false)
const selectedCancelReason = ref('')

// ─── 购买记录弹层 ─────────────────────────────────────────────────────────────
const showPurchaseModal = ref(false)
// ─── 转写记录弹层 ─────────────────────────────────────────────────────────────
const showTranscriptionModal = ref(false)
const purchaseLoading = ref(false)
const purchaseError = ref(false)
const purchaseList = ref<any[]>([])
const transcriptionLoading = ref(false)
const transcriptionError = ref(false)
const recordList = ref<any[]>([])

/** 购买记录/转写记录表格中的时间列：格式化为 YYYY-MM-DD HH:mm */
function formatPaymentTime(value: unknown): string {
  const s = safeStr(value)
  if (!s) return '-'
  const date = new Date(s)
  if (Number.isNaN(date.getTime())) return s
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}`
}

/** 解析 queryBuyLogByUserId 返回的 payAmount（如 "CNY3.9"），直接显示币种代码 + 金额，如 "CNY3.90" */
function formatPaymentAmount(value: unknown): string {
  const s = safeStr(value)
  if (!s) return '-'
  const match = s.match(/^([A-Za-z]{2,4})([\d.]+)$/)
  if (match) {
    const code = (match[1] || '').toUpperCase()
    const num = Number(match[2])
    return Number.isFinite(num) ? `${code}${num.toFixed(2)}` : s
  }
  const n = safeNum(s)
  return Number.isFinite(n) ? `${n.toFixed(2)}` : s
}

/** 转写记录时间列，复用 formatPaymentTime 格式 */
function formatRecordTime(value: unknown): string {
  return formatPaymentTime(value)
}

/** queryRecordLogByUserId 返回的 timeCount 为秒，转为 "X分钟Y秒" */
function formatConsumedMinSec(value: unknown): string {
  const totalSec = Number(value)
  if (!Number.isFinite(totalSec) || totalSec < 0) return String(value ?? '-')
  const min = Math.floor(totalSec / 60)
  const sec = Math.floor(totalSec % 60)
  return `${min}${t('layout.settings.membershipContent.transcriptionHistoryData.minutes')}${sec}${t('layout.settings.membershipContent.transcriptionHistoryData.seconds')}`
}

/** 购买记录弹层打开时加载：apiQueryBuyLogByUserId，写入 purchaseList */
async function loadPurchaseLogs() {
  const userId = safeStr(loginStore.loginData.userId)
  if (!userId) return
  purchaseLoading.value = true
  purchaseError.value = false
  try {
    const res: any = await apiQueryBuyLogByUserId({ userId, pageNum: 1, pageSize: 50 })
    const payload = res?.data ?? res
    const list = Array.isArray(payload?.list) ? payload.list : []
    purchaseList.value = list
  } catch {
    purchaseError.value = true
    purchaseList.value = []
  } finally {
    purchaseLoading.value = false
  }
}

/** 转写记录弹层打开时加载：apiQueryRecordLogByUserId，写入 recordList */
async function loadRecordLogs() {
  const userId = safeStr(loginStore.loginData.userId)
  if (!userId) return
  transcriptionLoading.value = true
  transcriptionError.value = false
  try {
    const res: any = await apiQueryRecordLogByUserId({ userId, pageNum: 1, pageSize: 50 })
    const payload = res?.data ?? res
    const list = Array.isArray(payload?.list) ? payload.list : []
    recordList.value = list
  } catch {
    transcriptionError.value = true
    recordList.value = []
  } finally {
    transcriptionLoading.value = false
  }
}

/** 提交取消订阅（apiCancelStripeSubscription），成功后关闭弹层并重新拉取订阅状态 */
async function handleCancelSubscription() {
  if (!selectedCancelReason.value) {
    ElMessage.warning(t('layout.settings.membershipContent.cancelSubscriptionReasonPlaceholder'))
    return
  }
  const userId = safeStr(loginStore.loginData.userId)
  if (!userId) {
    ElMessage.error(t('layout.settings.membershipContent.cancelSubscriptionError.userNotLoggedIn'))
    return
  }
  const sub = subscription.value as any
  const subscriptionId = safeStr(
    sub?.subscriptionId ?? sub?.stripeSubscriptionId ?? sub?.subId ?? '',
  )
  try {
    await apiCancelStripeSubscription({
      userId,
      subscriptionId,
      cancelReason: selectedCancelReason.value,
    })
    ElMessage.success(t('layout.settings.membershipContent.cancelSubscriptionSuccess'))
    showCancelModal.value = false
    selectedCancelReason.value = ''
    // 重新拉取订阅状态，更新 canCancel 和页面数据
    const subRes: any = await apiQuerySubscripeByUserId({ userId, availablePlatform: 'WEB' })
    subscription.value = subRes?.data ?? null
  } catch {
    ElMessage.error(t('layout.settings.membershipContent.cancelSubscriptionError.failed'))
  }
}

/** 页面挂载时并行拉取：当前订阅、用户应用信息、商品列表、权益、绑定设备 */
onMounted(async () => {
  const userId = safeStr(loginStore.loginData.userId)
  if (!userId) {
    loading.value = false
    return
  }
  try {
    const [subRes, appRes, prodRes, privRes, bindRes] = await Promise.all([
      apiQuerySubscripeByUserId({ userId, availablePlatform: 'WEB' }),
      apiGetAppUserInfo({ userId }),
      apiGetSubscripeProductList({
        productBuyPlatform: 'web',
        appVersion: '0.4.63',
        availablePlatform: 'WEB',
      }),
      apiGetProductPrivileges({}),
      apiGetUserBindDeviceList({ userId }),
    ])
    subscription.value = (subRes as any)?.data ?? null
    appUserInfo.value = (appRes as any)?.data ?? null
    const data = (prodRes as any)?.data
    const list = Array.isArray(data)
      ? data
      : Array.isArray(data?.list)
        ? data.list
        : Array.isArray(data?.productList)
          ? data.productList
          : []
    const currency = (prodRes as any)?.currency ?? data?.currency
    products.value = list
      .map((item: any) => normalizeProduct(item, currency))
      .filter(Boolean) as SubscriptionProduct[]
    const bindData = (bindRes as any)?.data
    bindDevices.value = Array.isArray(bindData) ? bindData : []
    const privData = (privRes as any)?.data ?? privRes
    privilegesByTier.value = parsePrivilegesByTier(privData)
  } catch {
    subscription.value = null
    appUserInfo.value = null
    products.value = []
    bindDevices.value = []
    privilegesByTier.value = { explorer: [], professional: [], master: [] }
  } finally {
    loading.value = false
  }
})
</script>

<style lang="scss" scoped>
.settings-membership {
  padding-top: 15px;
  width: 790px;
  max-width: 790px;
  margin: 0 auto;
}

.settings-membership-section-title {
  font-family:
    'PingFang SC',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  font-weight: 700;
  font-size: 16px;
  margin: 0 0 20px 0;
}

.settings-membership-card {
  border-radius: 6px;
  border: 1px solid #f2f2f2;
  background-color: #fcfcfd;
  padding: 25px 20px 20px;
  margin-bottom: 20px;
  box-sizing: border-box;
}

.settings-membership-plan {
  font-family:
    'PingFang SC',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  font-weight: bold;
  font-size: 18px;
  font-weight: 500;
}

.settings-membership-progress-track {
  width: 100%;
  height: 8px;
  background-color: #e6eaee;
  border-radius: 20px;
  overflow: hidden;
  margin-bottom: 10px;
}

.settings-membership-progress-fill {
  height: 100%;
  background: linear-gradient(to right, #0051ff, #0075ff, #12acff, #24e3ff);
  border-radius: 8px;
  min-width: 0;
}

.settings-membership-usage-text {
  font-family:
    'PingFang SC',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  color: #000000;
}

.settings-membership-dates {
  margin-bottom: 20px;
}

.settings-membership-date-row {
  font-family:
    'PingFang SC',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  font-size: 14px;
  color: #9a9a9a;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 400;
}

.settings-membership-entries {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.settings-membership-entry {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border: 1px solid #f2f2f2;
  cursor: pointer;
  margin-bottom: 20px;
  font-weight: 350;
  font-family:
    'PingFang SC',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  font-size: 14px;
  color: rgb(0, 0, 0);
}

.settings-membership-entry-arrow {
  color: #9a9a9a;
}

.settings-membership-modal-body {
  height: 496px;
  overflow-y: auto;
}

.settings-membership-error {
  color: #f56c6c;
  margin: 0;
}

.settings-membership-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 16px;
}

.settings-membership-table th {
  border-bottom: 1px solid #e5e5e5;
}

/* 表格样式 */
.settings-membership-table th {
  padding: 10px 12px;
  text-align: left;
  background-color: #ffffff;
  border-bottom: 1px solid #f2f2f2;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.55);
  position: sticky;
  top: 0;
  z-index: 1;
}

.settings-membership-table td {
  padding: 15px 12px;
  text-align: left;
  color: rgba(0, 0, 0, 1);
}

.settings-membership-empty {
  color: #9a9a9a;
  text-align: center;
}

.settings-membership-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 30px;
  height: 35px;
}

.settings-membership-card-subtitle {
  font-family:
    'PingFang SC',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  font-weight: 400;
  font-size: 16px;
  margin: 0 0 10px 0;
}

.settings-membership-date-section {
  margin-top: 30px;
}

/* 隐藏滚动条 */
.settings-membership-modal-body::-webkit-scrollbar {
  display: none;
}

.settings-membership-modal-body {
  scrollbar-width: none;
}

/* 取消订阅按钮 */
.settings-membership-cancel-btn {
  height: 35px;
  padding: 0 16px;
  background-color: #ffffff;
  border: 1px solid #ff3737;
  border-radius: 6px;
  font-family:
    'PingFang SC',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  font-weight: 400;
  color: #ff3737;
  font-size: 16px;
  cursor: pointer;
  box-sizing: border-box;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background-color: #ffebeb;
  }

  &:active {
    background-color: #ffebeb;
  }
}

.settings-membership-cancel-modal {
  padding: 0;
}

.settings-membership-cancel-description {
  font-family:
    'PingFang SC',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  font-size: 14px;
  color: #000;
  margin-bottom: 20px;
  line-height: 1.6;
}

.settings-membership-cancel-reason {
  margin-bottom: 20px;
}

.settings-membership-cancel-reason-label {
  display: block;
  font-family:
    'PingFang SC',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  font-weight: 600;
  font-size: 14px;
  color: #1a1a1a;
  margin-bottom: 12px;
}

.settings-membership-cancel-reason-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.settings-membership-cancel-reason-option {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family:
    'PingFang SC',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  font-size: 14px;
  color: #1a1a1a;
  cursor: pointer;

  input {
    cursor: pointer;
  }
}

.settings-membership-cancel-modal-footer {
  display: flex;
  gap: 12px;

  .cancel-btn,
  .confirm-btn {
    flex: 1;
    height: 50px;
    font-size: 16px;
    border-radius: 6px;
  }

  .confirm-btn {
    background-color: #0075ff;
  }
}

.settings-membership-cancel-benefits {
  list-style: none;
  margin: 0 0 30px 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 250px;
  overflow-y: auto;
}

.settings-membership-cancel-benefit-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-family:
    'PingFang SC',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  font-size: 14px;
  color: #1a1a1a;
}

.settings-membership-cancel-check {
  color: #0075ff;
  font-size: 14px;
  flex-shrink: 0;

  &.highlight {
    color: #0075ff;
  }
}

.settings-membership-cancel-benefit-item.highlight {
  color: #0075ff;
  font-weight: 500;
}

.settings-membership-cancel-select {
  width: 100%;
  margin-bottom: 30px;
}

.settings-membership-cancel-confirm-btn {
  background-color: #ffffff;
  border: 1px solid #979797;
  color: #000;
}

:deep(.el-dialog__title) {
  color: #000;
  margin-left: 5px;
}

:deep(.el-dialog__header) {
  padding-bottom: 20px;
}

:deep(.el-dialog__body) {
  color: #000;
}

:deep(.el-select__wrapper) {
  min-height: 50px;
  background-color: rgba(236, 235, 235, 0.6);
  box-shadow: none;

  &:hover {
    box-shadow: none;
  }
}

:deep(.el-select__caret) {
  color: #7a7979;
}

:deep(.el-select__placeholder.is-transparent) {
  color: #000;
}

:deep(.el-select__placeholder) {
  color: #000;
}
</style>
<style lang="scss">
.buy-record {
  padding: 20px 15px;
}

.cancel-dialog {
  padding: 20px;
}

.reason-select {
  .el-select-dropdown__list {
    padding: 5px;
  }

  .el-select-dropdown__item {
    height: 40px;
    line-height: 40px;
    color: #000;
    margin-bottom: 5px;

    &.is-hovering {
      background-color: #ecebeb;
    }
  }
}
</style>
