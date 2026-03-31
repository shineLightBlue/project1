<template>
  <div class="merge-progress-wrapper">
    <div class="flex1"></div>
    <div class="merge-progress-content">
      <img src="@/assets/images/icon_merge.svg" alt="" class="progress-ring-spinner" />
      <span class="progress-text">
        {{ t('layout.secondaryNav.merge.merging') }}(<span class="num">{{ props.progress }}</span
        >%)
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  progress: number
}>()

// 计算圆环进度
// 圆周长 = 2 * π * r = 2 * 3.14159 * 8 ≈ 50.26
const dashOffset = computed(() => {
  const circumference = 50.26
  const progress = Math.max(0, Math.min(100, props.progress))

  // 0% 时显示 25% 的进度条，确保圆环可见
  const effectiveProgress = progress === 0 ? 25 : progress

  return circumference - (effectiveProgress / 100) * circumference
})
</script>

<style lang="scss" scoped>
.merge-progress-wrapper {
  display: flex;
  margin-top: 3px;
  flex-shrink: 0;

  .merge-progress-content {
    display: flex;
    align-items: center;
    gap: 3px;
  }

  .progress-ring-spinner {
    flex-shrink: 0;
    animation: rotate 1s linear infinite;
  }

  .progress-ring__value {
    transition: stroke-dashoffset 0.3s ease;
  }

  .progress-text {
    font-size: 12px;
    color: #0075ff;
    font-weight: 500;

    .num {
      width: 20px;
      text-align: center;
      display: inline-block;
    }
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
