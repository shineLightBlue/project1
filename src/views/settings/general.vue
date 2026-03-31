<template>
  <section class="settings-placeholder" ref="containerRef">
    <h2 class="settings-placeholder-title">{{ t('layout.settings.general') }}</h2>
    <div class="settings-list">
      <div class="settings-item">
        <div class="settings-item-label">{{ t('layout.settings.displayLanguage') }}</div>
        <!-- 下拉控件 -->
        <div class="settings-item-control" @click="toggleDropdown">
          <span class="selected-value">{{ currentLanguageLabel }}</span>
          <img src="@/assets/images/icon_dropdown.svg" class="dropdown-icon" />
        </div>
        <!-- 下拉菜单 -->
        <div v-if="dropdownVisible" class="dropdown-menu">
          <div
            v-for="option in languageOptions"
            :key="option.value"
            class="dropdown-menu-item"
            :class="{ selected: option.value === currentLocale }"
            @click.stop="selectOption(option)"
          >
            {{ t(`layout.settings.languages.${option.translationKey}`) }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

// 语言选项：value 为 i18n locale 值，translationKey 为语言包中对应的键
const languageOptions = [
  { value: 'zh', translationKey: 'zhCN' },
  { value: 'en', translationKey: 'enUS' },
  { value: 'de', translationKey: 'de' },
  { value: 'es', translationKey: 'es' },
  { value: 'fr', translationKey: 'fr' },
  { value: 'it', translationKey: 'it' },
  { value: 'ja', translationKey: 'ja' },
  { value: 'ru', translationKey: 'ru' },
  { value: 'zh-HK', translationKey: 'zhHK' },
  { value: 'zh-TW', translationKey: 'zhTW' },
]

// 当前选中语言的显示标签（根据当前 locale 查找对应翻译键）
const currentLanguageLabel = computed(() => {
  const currentOption = languageOptions.find(opt => opt.value === locale.value)
  return currentOption
    ? t(`layout.settings.languages.${currentOption.translationKey}`)
    : t('layout.settings.languages.zhCN') // 默认简体中文
})

// 当前实际语言代码（用于高亮）
const currentLocale = computed(() => locale.value)

const dropdownVisible = ref(false)

const toggleDropdown = () => {
  dropdownVisible.value = !dropdownVisible.value
}

const selectOption = (option: { value: string; translationKey: string }) => {
  locale.value = option.value
  localStorage.setItem('lang', option.value) // 必须与 i18n 初始化读取的键一致
  dropdownVisible.value = false
}

const containerRef = ref<HTMLElement | null>(null)

const handleClickOutside = (event: MouseEvent) => {
  if (!containerRef.value?.contains(event.target as Node)) {
    dropdownVisible.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style lang="scss" scoped>
.settings-placeholder {
  padding: 0px 20px;
}

.settings-placeholder-title {
  font-family: 'PingFang SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-weight: 700;
  font-size: 16px;
  color: #1a1a1a;
  margin: 0 0 10px 0;
}

.settings-item {
  position: relative;
  width: 600px;
  margin-bottom: 10px;

  &:last-child {
    border-bottom: none;
  }
}

.settings-item-label {
  font-family: 'PingFang SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 14px;
  margin-bottom: 10px;
  color: rgba(0, 0, 0, 1);
}

.settings-item-control {
  display: flex;
  border-radius: 6px;
  border: 1px solid #0000001a;
  align-items: center;
  padding: 12px;
  font-weight: 300;
  width: 100%;
  justify-content: space-between;
  background-color: #fff;
  transition: background-color 0.2s, border-color 0.2s;
  cursor: pointer;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
    border-color: #b3b3b3;
  }
}

.selected-value {
  font-family: 'PingFang SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 14px;
  color: rgba(0, 0, 0, 1);
}

.dropdown-icon {
  align-items: center;
  width: 10px;
  height: 10px;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% - 4px);
  left: 0;
  width: 100%;
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;
  margin-top: 4px;
  padding: 4px 0;
}

.dropdown-menu-item {
  font-family: 'PingFang SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 14px;
  padding: 10px 16px;
  color: #1a1a1a;
  cursor: pointer;
  transition: background-color 0.2s;
  white-space: nowrap;

  &:hover {
    background-color: rgba(0, 0, 0, 0.1);
  }

  &.selected {
    color: #1890ff;
    font-weight: 500;
    background-color: #f0f7ff;
  }
}
</style>