<template>
  <section class="section-block">
    <h2 class="section-subtitle">{{ t('layout.membership.moreTranscriptionTime.title') }}</h2>
    <div class="addon-grid" v-loading="loading">
      <MemberAddonCard
        v-for="item in addonCards"
        :key="item.productId"
        :addon-title-text="addonTitle(item)"
        :currency-symbol="item.currencySymbol"
        :amount-display="displayAmount(item)"
        :unit-text="addonUnitText(item)"
        :is-paying="payingProductId === item.productId"
        @checkout="$emit('checkout', item)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * 加购时长区块：仅展示 productType==='3' 的加购商品卡片列表。
 * 见 docs/会员中心业务逻辑.md §一、§4.3、§七。
 */
import { useI18n } from 'vue-i18n'
import MemberAddonCard from './MemberAddonCard.vue'

const { t } = useI18n()

defineProps<{
  addonCards: any[]
  loading: boolean
  payingProductId: string
  addonTitle: (item: any) => string
  displayAmount: (item: any) => string
  addonUnitText: (item: any) => string
}>()

defineEmits<{ (e: 'checkout', item: any): void }>()
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
  margin: 10px 0 15px;
  padding: 0;
}

.addon-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}
</style>
