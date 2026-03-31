<template>
  <article
    class="plan-card"
    :class="{
      featured: isFeatured,
      current: cardState === 'current',
    }"
  >
    <div class="badge" v-if="isFeatured">
      {{ t('layout.membership.subscriptionPlans.mostPopular') }}
    </div>
    <h3 class="plan-name" :class="{ featured: isFeatured }">{{ planDisplayName }}</h3>
    <div class="plan-price-row">
      <span class="plan-price">{{ currencySymbol }}{{ amountDisplay }}</span>
      <span class="plan-cycle">/{{ cycleText }}</span>
    </div>
    <button
      class="plan-action"
      type="button"
      :class="[cardState, { 'is-master-action': isFeatured && cardState === 'switchable' }]"
      :disabled="cardState !== 'switchable' || isPaying"
      @click="$emit('checkout')"
    >
      <span v-if="isPaying">{{ t('layout.membership.subscriptionPlans.loading') }}</span>
      <span v-else>{{ buttonText }}</span>
    </button>
    <div class="includes">{{ t('layout.membership.subscriptionPlans.includes') }}</div>
    <ul class="feature-list">
      <li
        v-for="(fe, idx) in featureEntries"
        :key="fe.label + String(idx)"
        :class="{ highlight: fe.isHighlight }"
      >
        <span class="feature-icon" :class="{ highlight: fe.isHighlight }" aria-hidden="true"></span>
        {{ fe.label }}
      </li>
    </ul>
  </article>
</template>

<script setup lang="ts">
/**
 * 单张套餐卡：名称、价格、计费周期、按钮（当前/即将生效/可切换）、权益列表。
 * 卡片状态与权益高亮见 docs/会员中心业务逻辑.md §4.4、§4.6。
 */
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps<{
  planDisplayName: string
  currencySymbol: string
  amountDisplay: string
  cycleText: string
  buttonText: string
  cardState: 'current' | 'pending' | 'switchable'
  isFeatured: boolean
  isPaying: boolean
  featureEntries: { label: string; isHighlight: boolean }[]
}>()

defineEmits<{ (e: 'checkout'): void }>()
</script>

<style lang="scss" scoped>
// Tick icon SVG data URI (blue #0075FF checkmark)
$tick-icon: url("data:image/svg+xml,%3Csvg viewBox='0 0 17.8286 12.8286' xmlns='http://www.w3.org/2000/svg' fill='none'%3E%3Cpath d='M1.41431 6.41431L6.41431 11.4143L16.4143 1.41431' stroke='%230075FF' stroke-linecap='square' stroke-width='2'/%3E%3C/svg%3E");

.plan-card {
  position: relative;
  width: 250px;
  padding: 15px;
  background-color: #ffffff;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  box-sizing: border-box;
  transition: all 0.15s ease;

  &:hover {
    border-color: #0075ff;
    box-shadow: 0 4px 12px rgba(0, 117, 255, 0.1);
  }

  // 主打方案（大师版）：渐变边框 + 渐变底色
  &.featured {
    border: 2px solid transparent;
    background-image:
      linear-gradient(to top, #bceefd, #f5fafe 15%, #ffffff 45%),
      linear-gradient(to right, #0051ff, #0075ff, #12acff, #24e3ff);
    background-origin: border-box;
    background-clip: padding-box, border-box;
    box-shadow: 0 4px 12px rgba(0, 117, 255, 0.15);

    &:hover {
      box-shadow: 0 4px 16px rgba(0, 117, 255, 0.2);
    }
  }
}

// 最受欢迎 badge
.badge {
  position: absolute;
  top: -2px;
  right: -2px;
  padding: 4px 11px;
  background: linear-gradient(to right, #14b4ff, #1fd5ff);
  border-radius: 0 6px;
  font-family:
    'PingFang SC',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  font-weight: 500;
  font-size: 12px;
  color: #ffffff;
  white-space: nowrap;
}

// 方案名
.plan-name {
  font-family:
    'PingFang SC',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  font-weight: 700;
  font-size: 20px;
  margin: 0 0 10px;
  padding: 0;
  display: inline-block;
  width: fit-content;

  // 大师版名称渐变色
  &.featured {
    background: linear-gradient(to right, #0051ff, #0075ff, #12acff, #24e3ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    color: transparent;
  }
}

// 价格行
.plan-price-row {
  display: flex;
  align-items: baseline;
  margin-bottom: 20px;
}

.plan-price {
  font-family:
    'Montserrat',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  font-weight: 700;
  font-size: 28px;
  line-height: 34px;
  color: #000000;
}

.plan-cycle {
  font-family:
    'PingFang SC',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  font-weight: 400;
  font-size: 14px;
  margin-left: 4px;
}

// 订阅按钮
.plan-action {
  width: 100%;
  padding: 9px 0;
  margin-bottom: 20px;
  border: 1px solid #d3d2d2;
  background-color: #fff;
  border-radius: 6px;
  font-family:
    'PingFang SC',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  box-sizing: border-box;

  &:hover:not(:disabled) {
    background-color: #f8f8f8;
    border-color: #0075ff;
    color: #0075ff;
  }

  // 当前方案 / 即将生效
  &.current,
  &.pending {
    color: #b3b3b3;
    cursor: not-allowed;
    opacity: 1;

    &:hover {
      background-color: #ffffff;
      border-color: #e8e8e8;
      color: #b3b3b3;
    }
  }

  // 大师版可订阅按钮（渐变）
  &.is-master-action {
    background: linear-gradient(to right, #0051ff, #0075ff, #12acff, #24e3ff);
    border: none;
    color: #ffffff;

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #0051ff, #0075ff);
      opacity: 0.9;
      color: #ffffff;
    }

    &.current,
    &.pending {
      color: #ffffff;
      cursor: not-allowed;
      opacity: 1;

      &:hover {
        background: linear-gradient(to right, #0051ff, #0075ff, #12acff, #24e3ff);
        border: none;
        color: #ffffff;
        opacity: 1;
      }
    }
  }

  &:disabled {
    cursor: not-allowed;
  }
}

// 包括 label
.includes {
  font-family:
    'PingFang SC',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  font-weight: 500;
  font-size: 14px;
  color: #7f7f7f;
  margin-bottom: 16px;
}

// 功能列表
.feature-list {
  list-style: none;
  margin: 0;
  padding: 0;

  li {
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
    font-size: 14px;
    color: #000000;
    margin-bottom: 8px;

    &:last-child {
      margin-bottom: 0;
    }

    // 高亮特性项
    &.highlight {
      font-weight: 500;
      color: #0075ff;
    }
  }
}

// Tick 图标
.feature-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  margin-top: 2px;
  background-image: $tick-icon;
  background-repeat: no-repeat;
  background-size: contain;
  background-position: center;
  display: inline-block;
}
</style>
