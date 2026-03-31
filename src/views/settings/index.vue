<template>
  <div class="settings-container">
    <div class="settings-nav-sidebar">
      <nav class="settings-nav">
        <div class="flex-center">
          <ShowMainNav />
          <div class="settings-nav-header">{{ t('layout.settings.title') }}</div>
        </div>
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.to"
          class="settings-nav-item"
          :class="{ active: isActive(item.to) }"
        >
          <img class="settings-nav-icon" :src="item.icon" alt="" />
          <span class="settings-nav-label">{{ item.label }}</span>
        </router-link>
      </nav>
    </div>
    <main class="settings-main">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
/**
 * 设置页布局：左侧导航（个人资料、账号安全、通用、会员、帮助与反馈、关于），右侧 router-view 展示对应子页。
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import ShowMainNav from '@/components/showMainNav.vue'

const { t } = useI18n()
const route = useRoute()

/** 设置左侧导航项：path、to、label、icon */
const navItems = computed(() => [
  {
    path: 'profile',
    to: '/settings/profile',
    label: t('layout.settings.profile'),
    icon: new URL('@/assets/images/icon_setting_userinfo.svg', import.meta.url).href,
  },
  {
    path: 'account-security',
    to: '/settings/account-security',
    label: t('layout.settings.accountSecurity'),
    icon: new URL('@/assets/images/icon_setting_account_and_safety.svg', import.meta.url).href,
  },
  {
    path: 'general',
    to: '/settings/general',
    label: t('layout.settings.general'),
    icon: new URL('@/assets/images/icon_setting_general.svg', import.meta.url).href,
  },
  {
    path: 'membership',
    to: '/settings/membership',
    label: t('layout.settings.membership'),
    icon: new URL('@/assets/images/icon_setting_member.svg', import.meta.url).href,
  },
  {
    path: 'help-feedback',
    to: '/settings/help-feedback',
    label: t('layout.settings.helpFeedbackTitle'),
    icon: new URL('@/assets/images/icon_setting_help_and_feedback.svg', import.meta.url).href,
  },
  {
    path: 'about',
    to: '/settings/about',
    label: t('layout.settings.about'),
    icon: new URL('@/assets/images/icon_setting_about.svg', import.meta.url).href,
  },
])

const isActive = (path: string) => {
  return route.path === path
}
</script>

<style lang="scss" scoped>
.settings-container {
  display: flex;
  height: 100%;
  background-color: #FFFFFF;
}

.settings-nav-sidebar {
  flex-shrink: 0;
  width: 240px;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  margin: 18px 0px 18px 50px;
  overflow-y: auto;
}

.settings-nav-header {
  font-family:
    'PingFang SC',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  font-weight: 500;
  font-size: 18px;
  color: #1a1a1a;
  margin: 20px 10px;
  flex-shrink: 0;
}

.settings-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 10px 10px 10px;
}

.settings-nav-item {
  display: flex;
  align-items: center;
  height: 40px;
  margin: 3px 0;
  padding: 2px 10px;
  border-radius: 6px;
  text-decoration: none;
  transition: all 0.2s ease;
  font-family:
    'PingFang SC',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  font-size: 14px;
  color: #1a1a1a;
  cursor: pointer;

  &:hover {
    background-color: #f4f3f3;
  }

  &.active {
    background-color: #f4f3f3;
  }
}

.settings-nav-icon {
  width: 20px;
  height: 20px;
  margin-right: 4px;
  flex-shrink: 0;
}

.settings-nav-label {
  flex: 1;
}

.settings-main {
  flex: 1;
  overflow-y: auto;
  padding: 40px;
  box-sizing: border-box;
  background-color: #ffffff;
}
</style>
