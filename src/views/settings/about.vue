<template>
  <section class="settings-placeholder">
    <h2 class="settings-placeholder-title">{{ t('layout.settings.aboutContent.socialMedia') }}</h2>
    <div class="about-content">
      <div class="left-column">
        <!-- 社交媒体 -->
        <div class="about-section">
          <div class="about-links">
            <a href="https://www.boyamic.com/" target="_blank" rel="noopener noreferrer" class="about-link-item">
              <img src="@/assets/images/icon_Official.svg" class="menu-svg" />
              {{ t('layout.settings.aboutContent.officialWebsite') }}
              <img src="@/assets/images/icon_link.svg" class="link-svg" />
            </a>
            <a href="https://www.facebook.com/BoyamicOfficial/" target="_blank" rel="noopener noreferrer" class="about-link-item">
              <img src="@/assets/images/icon_Facebook.svg" class="menu-svg" />
              {{ t('layout.settings.aboutContent.facebook') }}
              <img src="@/assets/images/icon_link.svg" class="link-svg" />
            </a>
            <a href="https://www.youtube.com/channel/UC6uU1y4-vxQqQEswOclQ2bw" target="_blank" rel="noopener noreferrer" class="about-link-item">
              <img src="@/assets/images/icon_Youtube.svg" class="menu-svg" />
              {{ t('layout.settings.aboutContent.youtube') }}
              <img src="@/assets/images/icon_link.svg" class="link-svg" />
            </a>
            <a href="https://www.instagram.com/boyaaudio/" target="_blank" rel="noopener noreferrer" class="about-link-item">
              <img src="@/assets/images/icon_Instagram.svg" class="menu-svg" />
              {{ t('layout.settings.aboutContent.instagram') }}
              <img src="@/assets/images/icon_link.svg" class="link-svg" />
            </a>
            <a href="https://www.linkedin.com/authwall?trk=bf&trkInfo=AQE7EAE84ZKaNgAAAZy8yt9QdITB_9Mks3z7Ne33wLJu8ctlTZWHau2dIoUX3Z8GtJwuozuh_QIbwCPKPmuujtn5BM-MAZYLcIrIbNV3UhFqR5KjYCbOyKSTcxgz4tvXECiexVA=&original_referer=&sessionRedirect=https%3A%2F%2Fwww.linkedin.com%2Fcompany%2Fboyaaudio%2F%3FviewAsMember%3Dtrue" target="_blank" rel="noopener noreferrer" class="about-link-item">
              <img src="@/assets/images/icon_LinkedIn.svg" class="menu-svg" />
              {{ t('layout.settings.aboutContent.linkedin') }}
              <img src="@/assets/images/icon_link.svg" class="link-svg" />
            </a>
            <a href="https://x.com/BOYAmic" target="_blank" rel="noopener noreferrer" class="about-link-item">
              <img src="@/assets/images/icon_X.svg" class="menu-svg" />
              {{ t('layout.settings.aboutContent.x') }}
              <img src="@/assets/images/icon_link.svg" class="link-svg" />
            </a>
            <a href="https://discord.com/invite/t3zSWZPcya" target="_blank" rel="noopener noreferrer" class="about-link-item">
              <img src="@/assets/images/icon_Discord.svg" class="menu-svg" />
              {{ t('layout.settings.aboutContent.discord') }}
              <img src="@/assets/images/icon_link.svg" class="link-svg" />
            </a>
          </div>
        </div>

        <!-- 法律与隐私 -->
        <div class="about-section">
          <h2 class="settings-placeholder-title">{{ t('layout.settings.aboutContent.legalPrivacy') }}</h2>
          <div class="about-links">
            <a
              :href="userAgreementUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="about-link-item"
            >
              {{ t('layout.settings.aboutContent.userAgreement') }}
              <img src="@/assets/images/icon_link.svg" class="link-svg" />
            </a>
            <a
              :href="privacyPolicyUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="about-link-item"
            >
              {{ t('layout.settings.aboutContent.privacyPolicy') }}
              <img src="@/assets/images/icon_link.svg" class="link-svg" />
            </a>
            <a
              href="https://boyanotra.com/policies/BoyaNotraCookiePolicyEn.html"
              target="_blank"
              rel="noopener noreferrer"
              class="about-link-item"
            >
              {{ t('layout.settings.aboutContent.cookiePolicy') }}
              <img src="@/assets/images/icon_link.svg" class="link-svg" />
            </a>
            <a
              href="javascript:void(0);"
              class="about-link-item"
              ref="cookieLink"
              @click="toggleCookiePref"
            >
              {{ t('layout.settings.aboutContent.cookieSettings') }}
              <img src="@/assets/images/icon_link.svg" class="link-svg" />
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Cookie 偏好面板 -->
    <div
      v-show="showCookiePref"
      class="cookie-popup"
      :style="{ top: popupY + 'px', left: popupX + 'px' }"
      ref="popupRef"
      @click.stop
    >
      <div class="cookie-preference-section">
        <div class="cookie-items">
          <!-- 必要项 -->
          <div class="cookie-item">
            <div class="cookie-header">
              <span class="item-title">{{ t('layout.settings.aboutContent.cookieSettingsContent.categories.necessary') }}</span>
              <label class="switch">
                <input type="checkbox" :checked="preferences.necessary" disabled />
                <span class="slider round"></span>
              </label>
            </div>
            <p class="item-desc">{{ t('layout.settings.aboutContent.cookieSettingsContent.categories.necessaryDesc') }}</p>
          </div>

          <!-- 功能项 -->
          <div class="cookie-item">
            <div class="cookie-header">
              <span class="item-title">{{ t('layout.settings.aboutContent.cookieSettingsContent.categories.functional') }}</span>
              <label class="switch">
                <input type="checkbox" v-model="preferences.functional" />
                <span class="slider round"></span>
              </label>
            </div>
            <p class="item-desc">{{ t('layout.settings.aboutContent.cookieSettingsContent.categories.functionalDesc') }}</p>
          </div>

          <!-- 分析项 -->
          <div class="cookie-item">
            <div class="cookie-header">
              <span class="item-title">{{ t('layout.settings.aboutContent.cookieSettingsContent.categories.analytics') }}</span>
              <label class="switch">
                <input type="checkbox" v-model="preferences.analytics" />
                <span class="slider round"></span>
              </label>
            </div>
            <p class="item-desc">{{ t('layout.settings.aboutContent.cookieSettingsContent.categories.analyticsDesc') }}</p>
          </div>

          <!-- 市场推广 -->
          <div class="cookie-item">
            <div class="cookie-header">
              <span class="item-title">{{ t('layout.settings.aboutContent.cookieSettingsContent.categories.marketing') }}</span>
              <label class="switch">
                <input type="checkbox" v-model="preferences.marketing" />
                <span class="slider round"></span>
              </label>
            </div>
            <p class="item-desc">{{ t('layout.settings.aboutContent.cookieSettingsContent.categories.marketingDesc') }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { getPolicyLink } from '@/utils/policyLinks'
import Cookies from 'js-cookie'

const { t, locale } = useI18n()

// 政策链接
const userAgreementUrl = computed(() => getPolicyLink('agreement', locale.value))
const privacyPolicyUrl = computed(() => getPolicyLink('privacy', locale.value))
const cookiePolicyUrl = computed(() => getPolicyLink('cookie', locale.value))

// Cookie 偏好
interface CookiePreferences {
  necessary: boolean
  functional: boolean
  analytics: boolean
  marketing: boolean
}

const preferences = ref<CookiePreferences>({
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false
})

const savePreferences = (prefs: CookiePreferences) => {
  // 强制必要项为 true
  prefs.necessary = true
  Cookies.set('cookie_preferences', JSON.stringify(prefs), { expires: 365, path: '/' })
}

watch(
  () => [preferences.value.functional, preferences.value.analytics, preferences.value.marketing],
  () => {
    savePreferences(preferences.value)
  },
  { deep: false }
)

const showCookiePref = ref(false)
const popupX = ref(0)
const popupY = ref(0)
const cookieLink = ref<HTMLElement | null>(null)
const popupRef = ref<HTMLElement | null>(null)

const toggleCookiePref = (e: MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()

  if (showCookiePref.value) {
    showCookiePref.value = false
  } else {
    let x = e.clientX + 15
    let y = e.clientY + 15

    const panelWidth = 280
    const panelHeight = 320
    const maxX = window.innerWidth - panelWidth
    const maxY = window.innerHeight - panelHeight

    if (x > maxX) x = maxX - 10
    if (y > maxY) y = maxY - 10
    if (x < 0) x = 10
    if (y < 0) y = 10

    popupX.value = x
    popupY.value = y
    showCookiePref.value = true
  }
}

const handleClickOutside = (e: MouseEvent) => {
  if (!showCookiePref.value) return
  const target = e.target as Node
  if (
    (cookieLink.value && cookieLink.value.contains(target)) ||
    (popupRef.value && popupRef.value.contains(target))
  ) {
    return
  }
  showCookiePref.value = false
}

const handleCloseOnScrollOrResize = () => {
  if (showCookiePref.value) {
    showCookiePref.value = false
  }
}

onMounted(() => {
  // 读取已保存的 Cookie 偏好
  const saved = Cookies.get('cookie_preferences')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      parsed.necessary = true
      preferences.value = { ...preferences.value, ...parsed }
    } catch (e) {
      console.warn('解析 Cookie 偏好失败', e)
    }
  }

  document.addEventListener('click', handleClickOutside)
  window.addEventListener('scroll', handleCloseOnScrollOrResize)
  window.addEventListener('resize', handleCloseOnScrollOrResize)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('scroll', handleCloseOnScrollOrResize)
  window.removeEventListener('resize', handleCloseOnScrollOrResize)
})
</script>

<style lang="scss" scoped>
.settings-placeholder {
  padding: 0px 20px;
  background-color: #ffffff;
  min-height: 100vh;
  max-width: 100%;
  box-sizing: border-box;
}

.settings-placeholder-title {
  font-family: 'PingFang SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-weight: 700;
  font-size: 16px;
  color: #1a1a1a;
  margin: 0 0 20px 0;
  line-height: 1.3;
}

.about-content {
  display: block;
}

.left-column {
  display: flex;
  flex-direction: column;
}

.about-section {
  display: flex;
  flex-direction: column;
  margin-top: 10px;
}

.about-links {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.about-link-item {
  display: flex;
  align-items: center;
  font-family: 'PingFang SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 16px;
  color: #1a1a1a;
  text-decoration: none;
  width: 100%;
  max-width: 600px;
  margin-bottom: 8px;
  padding: 13px 14px;
  border-radius: 6px;
  border: 1px solid rgba(231, 231, 231, 0.7);
  transition: background-color 0.2s ease;
  cursor: pointer;

  &:hover {
    background-color: #f0f0f0;
  }
}

.menu-svg {
  margin-right: 8px;
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.link-svg {
  margin-left: auto;
  width: 12px;
  height: 12px;
  object-fit: contain;
}

.cookie-popup {
  position: fixed;
  z-index: 1000;
  width: 280px;
  background-color: #ffffff;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 5px 5px 15px rgba(0, 0, 0, 0.15);
  transition: opacity 0.2s ease;
}

.cookie-preference-section {
  border-radius: 6px;
}

.cookie-items {
  display: flex;
  flex-direction: column;
}

.cookie-item {
  padding: 14px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);

  &:last-child {
    border-bottom: none;
  }
}

.cookie-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.item-title {
  font-family: 'PingFang SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 15px;
  font-weight: 400;
  color: #1a1a1a;
  line-height: 1.4;
}

.item-desc {
  font-family: 'PingFang SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 12px;
  color: #6c6c70;
  line-height: 1.4;
  padding-right: 4px;
  margin: 0;
}

.switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
  flex-shrink: 0;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(212, 212, 212, 0.6);
  transition: 0.2s;
  border-radius: 20px;
}

.slider:before {
  position: absolute;
  content: '';
  height: 18px;
  width: 18px;
  left: 1px;
  bottom: 1px;
  background-color: rgba(0, 94, 255, 1);
  transition: 0.2s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: rgba(179, 201, 239, 1);
}

input:focus + .slider {
  box-shadow: 0 0 1px rgba(0, 94, 255, 1);
}

input:checked + .slider:before {
  transform: translateX(20px);
}

input:disabled + .slider {
  background-color: rgba(179, 201, 239, 1);
  cursor: not-allowed;
  opacity: 0.4;
}

.slider.round {
  border-radius: 20px;
}

@media (max-width: 640px) {
  .about-link-item {
    max-width: 100%;
  }

  .cookie-popup {
    width: 260px;
  }
}
</style>