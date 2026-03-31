<template>
  <footer class="page-footer">
    <div>{{ t('layout.membership.footer.note') }}</div>
    <div class="footer-links">
      <a :href="userAgreementUrl" target="_blank">{{
        t('layout.membership.footer.userAgreement')
      }}</a>
      <span>|</span>
      <a :href="privacyPolicyUrl" target="_blank">{{
        t('layout.membership.footer.privacyPolicy')
      }}</a>
    </div>
  </footer>
</template>

<script setup lang="ts">
/** 页脚：购买说明、用户协议与隐私政策链接，见 docs/会员中心业务逻辑.md §一。 */
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'
import { getPolicyLink } from '@/utils/policyLinks.ts'

const { t, locale } = useI18n()

const userAgreementUrl = computed(() => getPolicyLink('agreement', locale.value))
const privacyPolicyUrl = computed(() => getPolicyLink('privacy', locale.value))
</script>

<style lang="scss" scoped>
.page-footer {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;

  > div:first-child {
    font-family:
      'PingFang SC',
      -apple-system,
      BlinkMacSystemFont,
      'Segoe UI',
      sans-serif;
    font-weight: 400;
    font-size: 12px;
    color: #9a9a9a;
    margin: 0;
  }
}

.footer-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  a,
  span {
    font-family:
      'PingFang SC',
      -apple-system,
      BlinkMacSystemFont,
      'Segoe UI',
      sans-serif;
    font-weight: 400;
    font-size: 12px;
    color: #9a9a9a;
    text-decoration: none;

    &:not(:nth-child(2)) {
      cursor: pointer;
      transition: color 0.15s ease;

      &:hover {
        color: #0075ff;
      }
    }
  }
}
</style>
