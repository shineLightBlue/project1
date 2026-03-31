<template>
  <el-dialog
    v-model="isDialogVisible"
    :title="t('dialogs.generateMethod.title')"
    width="420px"
    :show-close="true"
    :overflow="false"
    @close="closeDialog"
    class="generate-method-dialog"
  >
    <div class="method-list">
      <!-- 自动生成 -->
      <div
        class="method-item"
        :class="{ active: selectedMethod === 'auto' }"
        @click="selectedMethod = 'auto'"
      >
        <div class="method-info">
          <img :src="iconAuto" alt="auto" class="method-icon" />
          <div class="method-text">
            <span class="method-name">{{ t('dialogs.generateMethod.autoName') }}</span>
            <span class="method-desc">{{ t('dialogs.generateMethod.autoDesc') }}</span>
          </div>
        </div>
        <img v-if="selectedMethod === 'auto'" :src="iconCheck" alt="check" class="check-icon" />
      </div>
      <!-- 自定义生成 -->
      <div
        class="method-item"
        :class="{ active: selectedMethod === 'custom' }"
        @click="selectedMethod = 'custom'"
      >
        <div class="method-info">
          <img :src="iconCustom" alt="custom" class="method-icon" />
          <div class="method-text">
            <span class="method-name">{{ t('dialogs.generateMethod.customName') }}</span>
          </div>
        </div>
        <img v-if="selectedMethod === 'custom'" :src="iconCheck" alt="check" class="check-icon" />
      </div>
      <!-- 自定义选项 -->
      <div v-if="selectedMethod === 'custom'" class="custom-options">
        <div class="custom-option-item" @click="handleOpenTemplate">
          <div class="option-left">
            <img :src="iconMinutes" alt="minutes" class="option-icon" />
            <span>{{ t('dialogs.generateMethod.summaryTemplate') }}</span>
          </div>
          <div class="option-right">
            <span>{{ selectedTemplateName }}</span>
            <span class="arrow">&gt;</span>
          </div>
        </div>
        <div class="custom-option-item">
          <div class="option-left">
            <img :src="iconAi" alt="ai" class="option-icon" />
            <span>{{ t('dialogs.generateMethod.aiModel') }}</span>
          </div>
          <el-dropdown trigger="click" placement="bottom-end" teleported @command="handleModelSelect">
            <div class="option-right">
              <span>{{ selectedModelName }}</span>
              <span class="arrow">&#x25BE;</span>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="auto" :class="{ 'is-active': selectedModelId === 'auto' }">{{ t('dialogs.generateMethod.auto') }}</el-dropdown-item>
                <el-dropdown-item
                  v-for="model in modelList"
                  :key="model.displayName"
                  :command="model.displayName"
                  :class="{ 'is-active': selectedModelId === model.displayName }"
                >
                  {{ model.displayName }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <div class="custom-option-item">
          <div class="option-left">
            <img :src="iconLanguage" alt="language" class="option-icon" />
            <span>{{ t('dialogs.generateMethod.transcriptLanguage') }}</span>
          </div>
          <el-dropdown trigger="click" placement="bottom-end" teleported popper-class="language-dropdown-popper" @command="handleLanguageSelect">
            <div class="option-right">
              <span>{{ selectedLanguageName }}</span>
              <span class="arrow">&#x25BE;</span>
            </div>
            <template #dropdown>
              <el-dropdown-menu class="language-dropdown-menu">
                <el-dropdown-item
                  v-for="lang in languages"
                  :key="lang.code"
                  :command="lang.code"
                  :class="{ 'is-active': selectedLanguageCode === lang.code }"
                >
                  {{ lang.name }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <div class="custom-option-item">
          <div class="option-left">
            <img :src="iconSpeaker" alt="speaker" class="option-icon" />
            <span>{{ t('dialogs.generateMethod.distinguishSpeakers') }}</span>
          </div>
          <div class="option-right">
            <el-switch v-model="distinguishSpeaker" />
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button type="primary" class="confirm-button" @click="handleConfirm">
        {{ t('dialogs.generateMethod.generateNow') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { getModelList } from '@/api/allFiles/index'
import languages from '@/constants/languages2.json'
import iconAuto from '@/assets/allfiles/icon_generated_method_auto.svg'
import iconCustom from '@/assets/allfiles/icon_generated_method_custom.svg'
import iconMinutes from '@/assets/allfiles/icon_generated_method_minutes.svg'
import iconAi from '@/assets/allfiles/icon_generated_method_ai.svg'
import iconLanguage from '@/assets/allfiles/icon_generated_method_language.svg'
import iconSpeaker from '@/assets/allfiles/icon_generated_method_speaker.svg'
import iconCheck from '@/assets/images/icon_choose_file.svg'

interface ModelItem {
  description: string
  displayName: string
  vipLevel: string
}

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'confirm', 'open-template'])

const { t } = useI18n()

const isDialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const selectedMethod = ref<'auto' | 'custom'>('auto')
const distinguishSpeaker = ref(false)
const modelList = ref<ModelItem[]>([])
const selectedModelId = ref('auto')
const selectedLanguageCode = ref('zh-CN')
const selectedTemplateName = ref(t('dialogs.generateMethod.defaultTemplateName'))

const selectedModelName = computed(() => {
  if (selectedModelId.value === 'auto') return t('dialogs.generateMethod.auto')
  const model = modelList.value.find(m => m.displayName === selectedModelId.value)
  return model?.displayName ?? t('dialogs.generateMethod.auto')
})

const selectedLanguageName = computed(() => {
  const lang = languages.find(l => l.code === selectedLanguageCode.value)
  return lang?.name ?? t('dialogs.generateMethod.zhCNFallback')
})

function handleModelSelect(command: string) {
  selectedModelId.value = command
}

function handleLanguageSelect(command: string) {
  selectedLanguageCode.value = command
}

async function fetchModelList() {
  try {
    const res = await getModelList()
    if (Array.isArray(res?.data)) {
      modelList.value = res.data
    }
  } catch (error) {
    console.error('Failed to fetch model list:', error)
  }
}

watch(() => props.visible, (val) => {
  if (val && !modelList.value.length) {
    fetchModelList()
  }
})

function handleOpenTemplate() {
  emit('update:visible', false)
  emit('open-template', {
    modelId: selectedModelId.value,
    languageCode: selectedLanguageCode.value,
    distinguishSpeaker: distinguishSpeaker.value
  })
}

function updateTemplateName(name: string) {
  selectedTemplateName.value = name
}

defineExpose({ updateTemplateName })

function handleConfirm() {
  if (selectedMethod.value === 'auto') {
    emit('confirm', {
      method: 'auto',
      modelId: 'Auto',
      platform: 'Auto',
      languageCode: 'zh-CN',
      distinguishSpeaker: true,
      prompt: 'SMART_MINUTES'
    });
  } else {
    emit('confirm', {
      method: 'custom',
      modelId: selectedModelId.value,
      platform: selectedModelId.value === 'auto' ? 'Auto' : selectedModelId.value,
      languageCode: selectedLanguageCode.value,
      distinguishSpeaker: distinguishSpeaker.value,
      prompt: 'SMART_MINUTES'
    });
  }
  closeDialog()
}

function closeDialog() {
  emit('update:visible', false)
}
</script>

<style scoped lang="scss">
.method-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.method-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-radius: 10px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f5f7fa;
  }

  &.active {
    background-color: #f5f7fa;

    .method-name {
      color: #409eff;
    }
  }

  .method-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .method-icon {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
  }

  .method-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .method-name {
    font-size: 15px;
    font-weight: 500;
    color: #333;
  }

  .method-desc {
    font-size: 12px;
    color: #999;
  }

  .check-icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }
}

.custom-options {
  display: flex;
  flex-direction: column;
  padding-top: 4px;
}

.custom-option-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;

  .option-left {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    color: #333;
  }

  .option-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  .option-right {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 14px;
    color: #999;
    cursor: pointer;

    .arrow {
      font-size: 12px;
      color: #ccc;
    }
  }
}

.confirm-button {
  width: 100%;
  height: 44px;
  font-size: 16px;
  border: none;
  border-radius: 22px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;

  &:hover {
    background: linear-gradient(135deg, #3d9bf7 0%, #00d4e0 100%);
  }
}
</style>

<style lang="scss">
.language-dropdown-popper {
  .el-dropdown-menu {
    max-height: 300px;
    overflow-y: auto;
  }
}
</style>
