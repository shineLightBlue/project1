<template>
  <div class="member-page">
    <header class="page-head">
      <ShowMainNav />
      <h1 class="page-title">{{ t('layout.membership.title') }}</h1>
    </header>

    <MemberCurrentSubscription
      :current-plan-name="currentPlanName"
      :effective-end-date-text="effectiveEndDateText"
      :used-minutes="usedMinutes"
      :total-minutes="totalMinutes"
      :is-unlimited-plan="isUnlimitedPlan"
      :usage-percent="usagePercent"
      :loading="loadingSubscription"
    />

    <MemberPlanCards
      v-model:active-billing-cycle="activeBillingCycle"
      :plan-cards="planCards"
      :pending-product-ids="pendingProductIds"
      :loading="loadingProducts"
      :paying-product-id="payingProductId"
      :display-plan-name="displayPlanName"
      :display-amount="displayAmount"
      :billing-cycle-text="billingCycleText"
      :card-button-text="cardButtonText"
      :get-card-state="getCardState"
      :infer-plan-tier="inferPlanTier"
      :product-feature-entries="productFeatureEntries"
      @checkout="handleCheckout"
    />

    <MemberAddonCards
      :addon-cards="addonCards"
      :loading="loadingProducts"
      :paying-product-id="payingProductId"
      :addon-title="addonTitle"
      :display-amount="displayAmount"
      :addon-unit-text="addonUnitText"
      @checkout="handleCheckout"
    />

    <MemberFooter />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import MemberCurrentSubscription from './components/MemberCurrentSubscription.vue'
import MemberPlanCards from './components/MemberPlanCards.vue'
import MemberAddonCards from './components/MemberAddonCards.vue'
import MemberFooter from './components/MemberFooter.vue'
import {
  apiCreateStripeCheckoutSession,
  apiGetAppUserInfo,
  apiGetProductPrivileges,
  apiGetSubscripeProductList,
  apiGetUserCountry,
  apiQuerySubscripeByUserId,
} from '@/api'
import { useLoginStore } from '@/stores/login'
import { privilegeCodeToFeatureKey } from '@/utils/membershipPrivileges'
import ShowMainNav from '@/components/showMainNav.vue'

// 会员中心入口页。页面结构见 docs/会员中心业务逻辑.md §一；核心状态与接口见 §二、§三。

// ─── 类型定义 ──────────────────────────────────────────────────────────────────

/** 套餐卡展示状态：当前方案 / 即将生效 / 可切换，见 §4.4 */
type MemberCardState = 'current' | 'pending' | 'switchable'
/** 计费周期：仅按 productType 判断，见 §3.2 */
type BillingCycle = 'monthly' | 'annual' | 'unknown'
/** 套餐档位：探索版/专业版/大师版/加购，见 §4.1 */
type PlanTier = 'explorer' | 'professional' | 'master' | 'addon'

/** 订阅中的单条权益（code、displayValue 为唯一数值来源，禁止硬编码兜底） */
type SubscriptionPrivilege = { code?: string; displayValue?: string }
/** 当前订阅（apiQuerySubscripeByUserId），含 productId、pendingInterests、到期与用量等，见 §2.2 */
type SubscriptionPayload = {
  productId?: string
  pendingInterests?: Array<{ productId?: string }>
  privileges?: SubscriptionPrivilege[]
  memberType?: string
  effectiveDate?: string
  nextPayDate?: string
  useRecordRead?: string | number
  resetRecordNum?: string | number
}

/** 用户应用信息（apiGetAppUserInfo），含已用/重置分钟数、会员类型，见 §2.2 */
type AppUserInfoPayload = {
  useRecordRead?: string | number
  totalRecordRead?: string | number
  resetRecordNum?: string | number
  memberType?: string
}

type SubscriptionProduct = {
  productId: string
  productName: string
  productType: string // '0'=年付 '1'=月付 '3'=附加包
  currency?: string
  currencySymbol: string
  amountText: string
  amountNumber: number
  billingCycle: BillingCycle
  raw: Record<string, any>
  synthetic?: boolean // true 表示本地合成的探索版免费卡，非来自 API
}

/** 单条权益（getProductPrivileges 返回的 data[key] 数组元素） */
type PrivilegeEntry = {
  code: string
  displayValue: string
  isHighlight: boolean
}

/** 按套餐档位分组的权益；API key: 1=专业版 2=探索版 3=大师版 */
type PrivilegesByTier = Record<Exclude<PlanTier, 'addon'>, PrivilegeEntry[]>

// ─── 常量 ──────────────────────────────────────────────────────────────────────

// 货币代码 → 符号（API 未直接返回符号时的兜底，见 §3.2 normalizeProduct）
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

// 各档位展示的权益 code 兜底顺序（API 无数据时使用；与 privilegesByTier key 1/2/3 对应，见 §4.6）
const tierDefaultCodes: Record<Exclude<PlanTier, 'addon'>, string[]> = {
  explorer: [
    'TRANSCRIBE_MINUTES',
    'UNLIMITED_CLOUD_STORAGE',
    'TRANSCRIBE_LANGUAGES',
    'SPEAKER_IDENTIFICATION',
    'MULTIMODAL_INPUT',
    'ONE_CLICK_TAGGING',
    'TEXT_EDITING',
    'AUDIO_IMPORT',
    'CHATGPT_ACCESS',
    'GEMINI_ACCESS',
    'CLAUDE_ACCESS',
    'MINUTES_TRANSLATION',
    'MIND_MAP',
    'EXPORT_FORMATS',
    'PROFESSIONAL_TEMPLATES',
  ],
  professional: [
    'TRANSCRIBE_MINUTES',
    'UNLIMITED_CLOUD_STORAGE',
    'TRANSCRIBE_LANGUAGES',
    'DEEPSEEK_ACCESS',
    'DOUBAO_ACCESS',
    'TONGYI_QIANWEN_ACCESS',
    'EXPORT_FORMATS',
    'PROFESSIONAL_TEMPLATES',
    'CUSTOM_TEMPLATES',
    'ASK_AI',
    'SPEAKER_IDENTIFICATION',
    'MULTIMODAL_INPUT',
    'ONE_CLICK_TAGGING',
    'TEXT_EDITING',
    'AUDIO_IMPORT',
    'MINUTES_TRANSLATION',
    'MIND_MAP',
  ],
  master: [
    'TRANSCRIBE_MINUTES',
    'UNLIMITED_CLOUD_STORAGE',
    'TRANSCRIBE_LANGUAGES',
    'DEEPSEEK_ACCESS',
    'DOUBAO_ACCESS',
    'TONGYI_QIANWEN_ACCESS',
    'EXPORT_FORMATS',
    'PROFESSIONAL_TEMPLATES',
    'CUSTOM_TEMPLATES',
    'ASK_AI',
    'SPEAKER_IDENTIFICATION',
    'MULTIMODAL_INPUT',
    'ONE_CLICK_TAGGING',
    'TEXT_EDITING',
    'AUDIO_IMPORT',
    'MINUTES_TRANSLATION',
    'MIND_MAP',
  ],
}

// 权益 code → i18n feature key 见 @/utils/membershipPrivileges（与 /payment/success 共用）

// ─── 响应式状态 ────────────────────────────────────────────────────────────────

const { t } = useI18n()
const loginStore = useLoginStore()

const loadingSubscription = ref(false) // 当前订阅加载中
const loadingProducts = ref(false) // 商品列表加载中
const payingProductId = ref('') // 正在发起支付的产品 ID，用于按钮 loading 状态，见 §六

const subscription = ref<SubscriptionPayload | null>(null) // 当前订阅，见 §2.1
const appUserInfo = ref<AppUserInfoPayload | null>(null) // 用户应用信息（用量等），见 §2.1
const products = ref<SubscriptionProduct[]>([]) // 订阅商品列表（getSubscripeProductList），见 §2.1
/** getProductPrivileges 返回的 data：key 1=专业版 2=探索版 3=大师版，与 getSubscripeProductList 一起展示权益列表 */
const privilegesByTier = ref<PrivilegesByTier>({
  explorer: [],
  professional: [],
  master: [],
})
const activeBillingCycle = ref<'monthly' | 'annual'>('annual') // 月/年切换，见 §4.2
const isAboardFlag = ref(true) // 是否海外用户（apiGetUserCountry），影响 Stripe 结算地区，见 §3.1

// ─── 工具函数 ──────────────────────────────────────────────────────────────────

/** 安全转字符串并 trim，null/undefined 均返回空字符串 */
function safeStr(value: unknown) {
  return String(value ?? '').trim()
}

/** 安全转数字，非有限值（NaN / Infinity）返回 0 */
function safeNum(value: unknown) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

/** 从数组中取第一个非空字符串，全为空时返回 '' */
function pickFirstValidText(values: unknown[]) {
  for (const v of values) {
    const s = String(v ?? '').trim()
    if (s) return s
  }
  return ''
}

// ─── 数据规范化 ────────────────────────────────────────────────────────────────

/** 从商品项解析货币符号，多种字段别名 + currencySymbolMap 兜底，见 §3.2 */
function resolveCurrencySymbol(item: Record<string, any>, fallbackCurrency?: string) {
  const direct = pickFirstValidText([item.currencySymbol, item.currencySign, item.symbol])
  if (direct) return direct
  const code = pickFirstValidText([
    item.currency,
    item.currencyCode,
    item.currencyType,
    item.currencyUnit,
    fallbackCurrency,
  ]).toUpperCase()
  return currencySymbolMap[code] || '¥'
}

/** 按优先级依次尝试各金额字段，兜底返回 '0.00' */
function resolveAmount(item: Record<string, any>) {
  return (
    pickFirstValidText([
      item.price,
      item.amount,
      item.payAmount,
      item.priceAmount,
      item.productPrice,
      item.currentPrice,
      item.salePrice,
      item.originPrice,
      item.displayPrice,
      item.money,
      item.totalAmount,
      item.unitAmount,
    ]) || '0.00'
  )
}

/** 仅按 productType 判断计费周期：'0'=年 '1'=月，见 §3.2 */
function resolveBillingCycle(item: Record<string, any>): BillingCycle {
  const productType = safeStr(item.productType)
  if (productType === '0') return 'annual'
  if (productType === '1') return 'monthly'
  return 'unknown'
}

/** 商品项标准化（id/名称/价格/币种/计费周期），见 §3.2 */
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
    currency: pickFirstValidText([
      item.currency,
      item.currencyCode,
      item.currencyType,
      fallbackCurrency,
    ]),
    currencySymbol: resolveCurrencySymbol(item, fallbackCurrency),
    amountText,
    amountNumber: safeNum(amountText),
    billingCycle: resolveBillingCycle(item),
    raw: item,
  }
}

/** 推断套餐档位：加购仅认 productType==='3'，其余按 productId/productName/金额，见 §4.1 */
function inferPlanTier(item: SubscriptionProduct): PlanTier {
  if (item.productType === '3') return 'addon'
  const text = `${item.productId} ${item.productName}`.toLowerCase()
  if (text.includes('master') || text.includes('大师')) return 'master'
  if (text.includes('pro') || text.includes('professional') || text.includes('专业'))
    return 'professional'
  if (text.includes('explorer') || text.includes('探索') || item.amountNumber === 0)
    return 'explorer'
  return item.productType === '3' ? 'addon' : 'professional'
}

/** 解析 getProductPrivileges 返回的 data：key 1=专业版 2=探索版 3=大师版，对应要展示的权益列表 */
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

// ─── 计算属性 ──────────────────────────────────────────────────────────────────

/** 当前订阅对应的 productId，见 §五 */
const currentProductId = computed(() => safeStr(subscription.value?.productId))

/** 收集所有「即将生效」产品 ID（subscription.pendingInterests），用于卡片状态判断，见 §4.4 */
const pendingProductIds = computed(() => {
  const set = new Set<string>()
  ;(subscription.value?.pendingInterests || []).forEach((item) => {
    const id = safeStr(item?.productId)
    if (id) set.add(id)
  })
  return set
})

/** 套餐卡片列表：排除 addon，按 explorer→professional→master 各取一张，优先与 activeBillingCycle 一致；探索版无数据时合成免费卡，见 §4.2 */
const planCards = computed(() => {
  const list = products.value.filter((item) => inferPlanTier(item) !== 'addon')
  const tiers: Exclude<PlanTier, 'addon'>[] = ['explorer', 'professional', 'master']
  const result: SubscriptionProduct[] = []

  for (const tier of tiers) {
    const candidates = list.filter((item) => inferPlanTier(item) === tier)
    let chosen = candidates.find((item) => item.billingCycle === activeBillingCycle.value)
    if (!chosen)
      chosen = candidates.find((item) => item.billingCycle === 'unknown') || candidates[0]

    if (!chosen && tier === 'explorer') {
      chosen = {
        productId: 'explorer_default_free',
        productName: t('layout.membership.subscriptionPlans.explorer.name'),
        productType: activeBillingCycle.value === 'annual' ? '0' : '1',
        currency: 'CNY',
        currencySymbol: '¥',
        amountText: '0.00',
        amountNumber: 0,
        billingCycle: activeBillingCycle.value,
        raw: {},
        synthetic: true,
      }
    }

    if (chosen) result.push(chosen)
  }

  return result
})

/** 加购卡片列表：仅 productType==='3'，见 §4.3 */
const addonCards = computed(() => products.value.filter((item) => item.productType === '3'))

/** 卡片状态：当前方案 / 即将生效 / 可切换，见 §4.4 */
function getCardState(item: SubscriptionProduct): MemberCardState {
  if (item.productId === currentProductId.value) return 'current'
  if (pendingProductIds.value.has(item.productId)) return 'pending'
  return 'switchable'
}

// ─── 展示辅助函数 ──────────────────────────────────────────────────────────────

/** 套餐卡按钮文案：当前/即将生效/免费/订阅等，见 §4.5 */
function cardButtonText(item: SubscriptionProduct) {
  const state = getCardState(item)
  if (state === 'current') return t('layout.membership.subscriptionPlans.currentPlan')
  if (state === 'pending') return t('layout.membership.subscriptionPlans.pendingPlan')
  if (inferPlanTier(item) === 'explorer' || item.amountNumber === 0)
    return t('layout.membership.subscriptionPlans.explorer.button')
  if (inferPlanTier(item) === 'master')
    return t('layout.membership.subscriptionPlans.master.button')
  return t('layout.membership.subscriptionPlans.professional.button')
}

/** 计费周期展示文案：月/年，见 §3.2 */
function billingCycleText(item: SubscriptionProduct) {
  if (item.productType === '1' || item.billingCycle === 'monthly')
    return t('layout.membership.subscriptionPlans.month')
  if (item.productType === '0' || item.billingCycle === 'annual')
    return t('layout.membership.subscriptionPlans.year')
  return '-'
}

/** 价格展示：保留两位小数 */
function displayAmount(item: SubscriptionProduct) {
  const raw = String(item.amountText ?? '').trim()
  const n = Number(raw)
  if (!Number.isFinite(n)) return raw || '0.00'
  return n.toFixed(2)
}

/** 日期格式化为 YYYY-MM-DD，见 §五 */
function normalizeDateText(value: unknown) {
  const text = safeStr(value)
  if (!text) return '-'
  const date = new Date(text)
  if (Number.isNaN(date.getTime())) return text
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const effectiveEndDateText = computed(() => normalizeDateText(subscription.value?.effectiveDate)) // 当前订阅到期日，§五
const usedMinutes = computed(() =>
  Math.floor(safeNum(appUserInfo.value?.useRecordRead ?? subscription.value?.useRecordRead)),
) // 已用分钟，§五
const minutesPrivilege = computed(() =>
  (subscription.value?.privileges || []).find(
    (item) => safeStr(item.code) === 'TRANSCRIBE_MINUTES',
  ),
)
/** 总分钟数：优先 totalRecordRead，否则 resetRecordNum，最后权益 TRANSCRIBE_MINUTES.displayValue；数值仅来自 API，见 §五 */
const totalMinutes = computed(() => {
  const byTotal = safeNum(
    appUserInfo.value?.totalRecordRead ??
      appUserInfo.value?.resetRecordNum ??
      subscription.value?.resetRecordNum,
  )
  if (byTotal > 0) return Math.floor(byTotal)
  const value = safeNum(minutesPrivilege.value?.displayValue)
  return value > 0 ? Math.floor(value) : 0
})
/** 是否无限时长：displayValue==='-1' 或 totalRecordRead===-1 或 memberType 4/5，见 §五 */
const isUnlimitedPlan = computed(() => {
  const value = safeStr(minutesPrivilege.value?.displayValue)
  const memberType = safeStr(appUserInfo.value?.memberType ?? subscription.value?.memberType)
  const totalRecord = safeNum(
    appUserInfo.value?.totalRecordRead ??
      appUserInfo.value?.resetRecordNum ??
      subscription.value?.resetRecordNum,
  )
  return value === '-1' || totalRecord === -1 || memberType === '4' || memberType === '5'
})
/** 用量进度条百分比：大师版无限时为 0；否则 used/total 限制 0–100，见 §五 */
const usagePercent = computed(() => {
  const total = totalMinutes.value
  const used = usedMinutes.value
  const unlimited = isUnlimitedPlan.value
  const currentProduct = products.value.find((p) => p.productId === currentProductId.value)
  const tier = currentProduct ? inferPlanTier(currentProduct) : ''
  if (tier === 'master' && unlimited) return 0
  if (!total) return 0
  return Math.max(0, Math.min(100, Math.floor((used / total) * 100)))
})

const currentPlanName = computed(() => {
  const id = currentProductId.value
  if (!id) return t('layout.membership.memberType.notMember')
  const matched = products.value.find((item) => item.productId === id)
  if (!matched) return t('layout.membership.memberType.notMember')
  return displayPlanName(matched)
})

/** 套餐展示名称：按档位取 i18n 或 productName，见 §五 */
function displayPlanName(item: SubscriptionProduct | null) {
  if (!item) return '-'
  const tier = inferPlanTier(item)
  if (tier === 'explorer') return t('layout.membership.subscriptionPlans.explorer.name')
  if (tier === 'professional') return t('layout.membership.subscriptionPlans.professional.name')
  if (tier === 'master') return t('layout.membership.subscriptionPlans.master.name')
  return item.productName || item.productId
}

/**
 * 权益 code → 展示标签的兜底格式化（i18n 取不到时使用）；数值仅用 API 的 displayValue，见 §4.6。
 */
function formatFeatureByCode(code: string, displayValue: string) {
  switch (code) {
    case 'TRANSCRIBE_MINUTES':
      return displayValue === '-1' ? '无限转写时长' : `${displayValue}mins转写/月`
    case 'UNLIMITED_CLOUD_STORAGE':
      return '无限云存储空间'
    case 'TRANSCRIBE_LANGUAGES':
      return `转写语言${displayValue}+`
    case 'CHATGPT_ACCESS':
      return 'ChatGPT'
    case 'GEMINI_ACCESS':
      return 'Gemini'
    case 'CLAUDE_ACCESS':
      return 'Claude'
    case 'GROK_ACCESS':
      return 'Grok'
    case 'DEEPSEEK_ACCESS':
      return 'DeepSeek'
    case 'DOUBAO_ACCESS':
      return 'Doubao'
    case 'TONGYI_QIANWEN_ACCESS':
      return '通义千问'
    case 'EXPORT_FORMATS':
      return `导出文件${displayValue}种格式`
    case 'PROFESSIONAL_TEMPLATES':
      return `专业模板${displayValue}款`
    case 'CUSTOM_TEMPLATES':
      return '自定义模板'
    case 'ASK_AI':
      return 'ASK AI'
    case 'SPEAKER_IDENTIFICATION':
      return '区分说话人'
    case 'MULTIMODAL_INPUT':
      return '多模态输入'
    case 'ONE_CLICK_TAGGING':
      return '一键标记'
    case 'TEXT_EDITING':
      return '文本编辑'
    case 'AUDIO_IMPORT':
      return '音频导入'
    case 'MINUTES_TRANSLATION':
      return '纪要翻译'
    case 'MIND_MAP':
      return '思维导图'
    default:
      return code
  }
}

/** 按套餐档位取 getProductPrivileges 返回的权益列表；无数据时用 tierDefaultCodes 兜底（displayValue 为空），见 §4.6 */
function getPrivilegeEntriesForTier(tier: Exclude<PlanTier, 'addon'>): PrivilegeEntry[] {
  const list = privilegesByTier.value[tier] || []
  if (list.length) return list
  return tierDefaultCodes[tier].map((code) => ({ code, displayValue: '', isHighlight: false }))
}

function productFeatureLabels(item: SubscriptionProduct) {
  return productFeatureEntries(item).map((e) => e.label)
}

type FeatureEntry = { label: string; isHighlight: boolean }

/** 套餐卡权益列表：来自 getProductPrivileges 按 tier 的权益，code/displayValue 经 i18n 显示，isHighlight 时高亮；与 getSubscripeProductList 的套餐一起展示 */
function productFeatureEntries(item: SubscriptionProduct): FeatureEntry[] {
  const tier = inferPlanTier(item)
  if (tier === 'addon') return []

  const entries = getPrivilegeEntriesForTier(tier)
  const seen = new Set<string>()
  const result: FeatureEntry[] = []
  const originalTierKey =
    tier === 'explorer' ? 'explorer' : tier === 'professional' ? 'professional' : 'master'
  for (const entry of entries) {
    const featureKey = privilegeCodeToFeatureKey[entry.code] || entry.code
    const tierKey =
      originalTierKey === 'explorer' && ['deepseek', 'doubao', 'tongyiQianwen'].includes(featureKey)
        ? 'professional'
        : originalTierKey
    const i18nKey = `layout.membership.subscriptionPlans.${tierKey}.features.${featureKey}`
    const fallback = formatFeatureByCode(entry.code, entry.displayValue)
    const label = t(i18nKey, fallback, { named: { value: entry.displayValue } })
    if (seen.has(label)) continue
    seen.add(label)
    result.push({ label, isHighlight: entry.isHighlight === true })
  }
  return result
}

/** 加购卡标题：仅用 API 的 recordNumber 展示为「x分钟」，见 §七 */
function addonTitle(item: SubscriptionProduct) {
  const recordNumber = safeNum(item.raw?.recordNumber)
  return `${Math.floor(recordNumber)}${t('layout.membership.moreTranscriptionTime.minutes')}`
}

/** 加购单价文案：优先 unitPrice/perPrice/singlePrice，否则总价/recordNumber 折算，见 §七 */
function addonUnitText(item: SubscriptionProduct) {
  const raw = item.raw
  const perMinute = safeNum(raw.unitPrice || raw.perPrice || raw.singlePrice)
  if (perMinute > 0)
    return `${item.currencySymbol}${perMinute.toFixed(4)}/${t('layout.membership.moreTranscriptionTime.perMinute')}`
  const minuteMatch = addonTitle(item).match(/(\d+)/)
  const minutes = minuteMatch ? Number(minuteMatch[1]) : 0
  if (minutes > 0 && item.amountNumber > 0)
    return `${item.currencySymbol}${(item.amountNumber / minutes).toFixed(4)}/${t('layout.membership.moreTranscriptionTime.perMinute')}`
  return '-'
}

/** 获取用户国家并设置 isAboardFlag（非中国为 true），用于 Stripe 结算地区，见 §3.1 */
async function loadUserCountry() {
  try {
    const res = await apiGetUserCountry()
    const envelope = (res as any) || {}
    const payload = envelope?.data ?? {}
    const country = safeStr(payload?.country)
    if (country) {
      isAboardFlag.value = country !== '中国'
      return
    }
    isAboardFlag.value = true
    ElMessage.warning(t('layout.membership.payment.error.regionDetecting'))
  } catch {
    isAboardFlag.value = true
    ElMessage.warning(t('layout.membership.payment.error.regionDetecting'))
  }
}

/** 加载当前订阅（apiQuerySubscripeByUserId），见 §3.1 */
async function loadSubscription() {
  const userId = safeStr(loginStore.loginData.userId)
  if (!userId) {
    subscription.value = null
    return
  }
  loadingSubscription.value = true
  try {
    const res = await apiQuerySubscripeByUserId({ userId, availablePlatform: 'WEB' })
    subscription.value = ((res as any)?.data ?? null) as SubscriptionPayload | null
  } catch (error: any) {
    subscription.value = null
    ElMessage.error(error?.message || t('layout.membership.payment.error.paymentFailed'))
  } finally {
    loadingSubscription.value = false
  }
}

/** 加载用户应用信息（apiGetAppUserInfo），见 §3.1 */
async function loadAppUserInfo() {
  const userId = safeStr(loginStore.loginData.userId)
  if (!userId) {
    appUserInfo.value = null
    return
  }
  try {
    const res = await apiGetAppUserInfo({ userId })
    appUserInfo.value = ((res as any)?.data ?? null) as AppUserInfoPayload | null
  } catch {
    appUserInfo.value = null
  }
}

/** 加载订阅商品列表（apiGetSubscripeProductList），normalizeProduct 后写入 products，见 §3.1 */
async function loadProducts() {
  loadingProducts.value = true
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
    products.value = list
      .map((item: Record<string, any>) => normalizeProduct(item, commonCurrency))
      .filter(Boolean) as SubscriptionProduct[]
  } catch (error: any) {
    products.value = []
    ElMessage.error(error?.message || t('layout.membership.payment.error.paymentFailed'))
  } finally {
    loadingProducts.value = false
  }
}

/** 加载按档位分组的权益（apiGetProductPrivileges），data key 1/2/3 → professional/explorer/master，见 §3.1、§4.6 */
async function loadProductPrivileges() {
  try {
    const res = await apiGetProductPrivileges({})
    const payload = (res as any)?.data ?? res
    privilegesByTier.value = parsePrivilegesByTier(payload)
  } catch {
    privilegesByTier.value = { explorer: [], professional: [], master: [] }
  }
}

/** 发起支付：仅 switchable 且非 synthetic；创建 Stripe 会话后跳转收银台，见 §六 */
async function handleCheckout(item: SubscriptionProduct) {
  if (getCardState(item) !== 'switchable' || item.synthetic) return
  const userId = safeStr(loginStore.loginData.userId)
  if (!userId) {
    ElMessage.error(t('layout.membership.payment.error.userNotLoggedIn'))
    return
  }
  if (!item.productId) {
    ElMessage.error(t('layout.membership.payment.error.productIdRequired'))
    return
  }

  payingProductId.value = item.productId
  try {
    const origin = window.location.origin
    const successUrl = `${origin}/payment/success?productId=${encodeURIComponent(item.productId)}&sessionId={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${origin}/payment/failure`
    const res = await apiCreateStripeCheckoutSession({
      userId,
      productId: item.productId,
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

/** 页面挂载时并行请求：国家、订阅、用户信息、商品列表、权益，见 §3.1 */
onMounted(async () => {
  await Promise.all([
    loadUserCountry(),
    loadSubscription(),
    loadAppUserInfo(),
    loadProducts(),
    loadProductPrivileges(),
  ])
})
</script>

<style lang="scss" src="./member.scss" scoped></style>
