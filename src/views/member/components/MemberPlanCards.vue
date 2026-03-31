<template>
  <section class="section-block">
    <h2 class="section-subtitle">{{ t('layout.membership.subscriptionPlans.title') }}</h2>
    <div class="billing-toggle-wrap">
      <button
        type="button"
        class="billing-tab"
        :class="{ active: activeBillingCycle === 'monthly' }"
        @click="$emit('update:activeBillingCycle', 'monthly')"
      >
        {{ t('layout.membership.subscriptionPlans.monthly') }}
      </button>
      <button
        type="button"
        class="billing-tab"
        :class="{ active: activeBillingCycle === 'annual' }"
        @click="$emit('update:activeBillingCycle', 'annual')"
      >
        {{ t('layout.membership.subscriptionPlans.annual') }}<span class="discount-tag">-29%</span>
      </button>
    </div>
    <!--    <div class="pending-tip" v-if="pendingProductIds.size > 0">-->
    <!--      {{ t('layout.membership.subscriptionPlans.pendingPlanTip') }}-->
    <!--    </div>-->
    <div class="plan-grid" v-loading="loading">
      <MemberPlanCard
        v-for="item in planCards"
        :key="item.productId"
        :plan-display-name="displayPlanName(item)"
        :currency-symbol="item.currencySymbol"
        :amount-display="displayAmount(item)"
        :cycle-text="billingCycleText(item)"
        :button-text="cardButtonText(item)"
        :card-state="getCardState(item)"
        :is-featured="inferPlanTier(item) === 'master'"
        :is-paying="payingProductId === item.productId"
        :feature-entries="productFeatureEntries(item)"
        @checkout="$emit('checkout', item)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * 套餐选择区：月/年切换、待生效提示、三档套餐卡列表（探索/专业/大师）。
 * 见 docs/会员中心业务逻辑.md §一、§4.2。
 */
import { useI18n } from 'vue-i18n'
import MemberPlanCard from './MemberPlanCard.vue'

const { t } = useI18n()

defineProps<{
  activeBillingCycle: 'monthly' | 'annual'
  planCards: any[]
  pendingProductIds: Set<string>
  loading: boolean
  payingProductId: string
  displayPlanName: (item: any) => string
  displayAmount: (item: any) => string
  billingCycleText: (item: any) => string
  cardButtonText: (item: any) => string
  getCardState: (item: any) => 'current' | 'pending' | 'switchable'
  inferPlanTier: (item: any) => string
  productFeatureEntries: (item: any) => { label: string; isHighlight: boolean }[]
}>()

defineEmits<{
  (e: 'update:activeBillingCycle', value: 'monthly' | 'annual'): void
  (e: 'checkout', item: any): void
}>()
</script>

<style lang="scss" scoped>
.section-subtitle {
  font-family:
    'PingFang SC',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  font-weight: 700;
  font-size: 18px;
  margin: 10px 0 20px 0;
  padding: 0;
}

.billing-toggle-wrap {
  display: flex;
  gap: 0;
  width: fit-content;
  height: 26px;
  background-color: #ecebeb;
  border-radius: 2px;
  padding: 2px;
  box-sizing: border-box;
  margin-bottom: 22px;
}

.billing-tab {
  height: 22px;
  padding: 0 8px;
  background-color: transparent;
  border: none;
  border-radius: 2px;
  font-family:
    'PingFang SC',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  font-weight: 400;
  font-size: 12px;
  color: #9a9a9a;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  white-space: nowrap;

  &.active {
    background-color: #ffffff;
    color: #000000;
  }

  &:hover {
    color: #9a9a9a;
  }
}

.discount-tag {
  font-family:
    'PingFang SC',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  font-weight: 500;
  font-size: 12px;
  background: linear-gradient(to right, #0051ff, #0075ff, #12acff, #12acff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-left: 4px;
}

.pending-tip {
  font-family:
    'PingFang SC',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  font-weight: 400;
  font-size: 14px;
  color: #666666;
  margin-bottom: 16px;
  line-height: 1.5;
}

.plan-grid {
  display: grid;
  grid-template-columns: repeat(3, 250px);
  gap: 24px;
  justify-content: center;
}
</style>
