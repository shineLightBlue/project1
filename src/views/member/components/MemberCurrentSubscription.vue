<template>
  <section class="section-block">
    <div class="section-head">
      <h2 class="section-subtitle">{{ t('layout.membership.currentSubscription.title') }}</h2>
      <div class="flex-center" @click="goToSettingsMembership">
        <span class="section-link">
          {{ t('layout.membership.currentSubscription.details') }}
        </span>
        <img class="arrow" src="@/assets/images/icon-arrow.svg" alt="" />
      </div>
    </div>
    <div class="current-card" v-loading="loading">
      <div class="current-top">
        <div class="current-name">{{ currentPlanName }}</div>
        <div class="current-expire">
          {{
            t('layout.membership.currentSubscription.expiration', { date: effectiveEndDateText })
          }}
        </div>
      </div>
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: `${usagePercent}%` }" />
      </div>
      <div class="progress-text" v-if="!isUnlimitedPlan">
        {{
          t('layout.membership.currentSubscription.usage', {
            used: usedMinutes,
            total: totalMinutes,
          })
        }}
      </div>
      <div class="progress-text" v-else>
        {{ t('layout.membership.currentSubscription.usageUnlimited', { used: usedMinutes }) }}
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * 当前订阅区块：展示当前套餐名、到期日、转写用量进度条（已用/总量或无限）。
 * 数据与规则见 docs/会员中心业务逻辑.md §五。
 */
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { t } = useI18n()
const router = useRouter()

function goToSettingsMembership() {
  void router.push('/settings/membership')
}

defineProps<{
  currentPlanName: string
  effectiveEndDateText: string
  usedMinutes: number
  totalMinutes: number
  isUnlimitedPlan: boolean
  usagePercent: number
  loading: boolean
}>()
</script>

<style lang="scss" scoped>
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;

  .arrow {
    margin-left: 10px;
  }
}

.section-subtitle {
  font-family:
    'PingFang SC',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  font-weight: 700;
  font-size: 18px;
  margin: 0;
  padding: 0;
}

.section-link {
  font-family:
    'PingFang SC',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  cursor: pointer;
  user-select: none;

  &:hover {
    opacity: 0.8;
  }
}

.current-card {
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-sizing: border-box;
}

.current-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.current-name {
  font-family:
    'PingFang SC',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  font-weight: 500;
  font-size: 24px;
}

.current-expire {
  font-family:
    'PingFang SC',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  font-weight: 400;
  font-size: 14px;
  color: #9a9a9a;
}

.progress-track {
  width: 100%;
  height: 7px;
  background-color: #e6eaee;
  border-radius: 20px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(to right, #0051ff, #0075ff, #12acff, #24e3ff);
  border-radius: 8px;
  transition: width 0.3s ease;
  min-width: 0;
}

.progress-text {
  font-family:
    'PingFang SC',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  font-weight: 400;
  font-size: 14px;
  color: #000000;
}
</style>
