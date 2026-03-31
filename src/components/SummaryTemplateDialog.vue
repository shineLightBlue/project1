<template>
  <el-dialog
    v-model="isDialogVisible"
    :title="t('dialogs.summaryTemplate.title')"
    width="900px"
    :show-close="true"
    @close="closeDialog"
    class="summary-template-dialog generate-modal"
  >
    <div class="template-body">
      <!-- 左侧分类列表 -->
      <div class="category-sidebar">
        <div
          v-for="category in categoryList"
          :key="category.dictCode"
          class="category-item"
          :class="{ active: activeCategoryCode === category.dictValue }"
          @click="activeCategoryCode = category.dictValue"
        >
          <div class="category-info">
            <img :src="safeRemoteImageUrl(category.cssClass)" alt="" class="category-icon" />
            <span>{{ category.dictLabel }}</span>
          </div>
          <span class="category-arrow">&gt;</span>
        </div>
      </div>
      <!-- 右侧模板网格 -->
      <div class="template-grid-area">
        <div v-if="activeTemplates.length || activeCategoryCode === 'custom'" class="template-grid">
          <!-- 自定义分类时，最前面显示创建按钮 -->
          <div
            v-if="activeCategoryCode === 'custom'"
            class="template-card template-card-create"
            @click="openCustomTemplateDialog"
          >
            <el-icon class="create-plus-icon"><Plus /></el-icon>
            <span class="template-name">{{ t('dialogs.summaryTemplate.create') }}</span>
          </div>
          <div
            v-for="tpl in activeTemplates"
            :key="tpl.id"
            class="template-card"
            :class="{ selected: selectedTemplateCode === tpl.templateCode }"
            @click="selectedTemplateCode = tpl.templateCode"
          >
            <img
              :src="iconHint"
              alt="preview"
              class="hint-icon"
              @click.stop="openPreview(tpl)"
            />
            <img :src="safeRemoteImageUrl(tpl.iconUrl)" alt="" class="template-icon" />
            <span class="template-name">{{ tpl.templateName }}</span>
          </div>
        </div>
        <div v-else class="template-empty">{{ t('dialogs.summaryTemplate.noTemplates') }}</div>
      </div>
    </div>

    <!-- 自定义模板弹窗 -->
    <el-dialog
      v-model="customTemplateVisible"
      :title="t('dialogs.summaryTemplate.customTitle')"
      width="500px"
      :show-close="true"
      append-to-body
      class="custom-template-dialog"
      @close="closeCustomTemplateDialog"
    >
      <div class="custom-template-form">
        <div class="form-item">
          <label class="form-label">{{ t('dialogs.summaryTemplate.templateName') }}</label>
          <el-input
            v-model="customTemplateName"
            :placeholder="t('dialogs.summaryTemplate.placeholderName')"
            maxlength="255"
            show-word-limit
            clearable
          />
        </div>
        <div class="form-item">
          <label class="form-label">{{ t('dialogs.summaryTemplate.prompt') }}</label>
          <el-input
            v-model="customTemplatePrompt"
            type="textarea"
            :placeholder="t('dialogs.summaryTemplate.placeholderPrompt')"
            :rows="6"
            maxlength="5000"
            show-word-limit
            resize="vertical"
          />
        </div>
      </div>
      <template #footer>
        <el-button @click="closeCustomTemplateDialog">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="customTemplateSaving" @click="saveCustomTemplate">
          {{ t('common.save') }}
        </el-button>
      </template>
    </el-dialog>
    <!-- 模板预览弹窗 -->
    <el-dialog
      v-model="previewVisible"
      :title="t('dialogs.summaryTemplate.previewTitle')"
      width="600px"
      append-to-body
      :show-close="true"
      class="template-preview-dialog"
    >
      <div class="preview-content">
        <div class="preview-label">{{ t('dialogs.summaryTemplate.overview') }}</div>
        <div
          v-if="previewTemplate?.previewPrompt"
          class="preview-editor"
          v-html="previewMarkdownHtml"
        ></div>
      </div>
    </el-dialog>
    <template #footer>
      <div class="template-footer">
        <div class="footer-settings">
          <!-- AI模型 -->
          <el-dropdown trigger="click" placement="top-start" teleported @command="handleModelSelect">
            <div class="footer-setting-item">
              <img :src="iconAi" alt="ai" class="footer-icon" />
              <div class="footer-setting-text">
                <span class="footer-label">{{ t('dialogs.summaryTemplate.aiModel') }}</span>
                <span class="footer-value">{{ selectedModelName }}</span>
              </div>
              <span class="footer-arrow">&#x25BE;</span>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="auto" :class="{ 'is-active': selectedModelId === 'auto' }">{{ t('dialogs.summaryTemplate.auto') }}</el-dropdown-item>
                <el-dropdown-item
                  v-for="model in modelList"
                  :key="model.description"
                  :command="model.displayName"
                  :class="{ 'is-active': selectedModelId === model.displayName }"
                >
                  {{ model.displayName }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <!-- 录音语言 -->
          <el-dropdown trigger="click" placement="top-start" teleported popper-class="language-dropdown-popper" @command="handleLanguageSelect">
            <div class="footer-setting-item">
              <img :src="iconLanguage" alt="language" class="footer-icon" />
              <div class="footer-setting-text">
                <span class="footer-label">{{ t('dialogs.summaryTemplate.recordingLanguage') }}</span>
                <span class="footer-value">{{ selectedLanguageName }}</span>
              </div>
              <span class="footer-arrow">&#x25BE;</span>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
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
          <!-- 区分发言人 -->
          <div class="footer-setting-item">
            <img :src="iconSpeaker" alt="speaker" class="footer-icon" />
            <span class="footer-label">{{ t('dialogs.summaryTemplate.distinguishSpeakers') }}</span>
            <el-switch v-model="distinguishSpeaker" />
          </div>
        </div>
        <el-button type="primary" class="confirm-button" @click="handleConfirm">
          {{ t('dialogs.summaryTemplate.generateNow') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { marked } from 'marked'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getSummaryTemplates, getModelList, addTemplate } from '@/api/allFiles/index'
import { useLoginStore } from '@/stores/login'
import { safeRemoteImageUrl } from '@/utils/safeRemoteImageUrl'
import languages from '@/constants/languages2.json'
import iconHint from '@/assets/allfiles/icon_minutes_template_hint.svg'
import iconAi from '@/assets/allfiles/icon_generated_method_ai.svg'
import iconLanguage from '@/assets/allfiles/icon_generated_method_language.svg'
import iconSpeaker from '@/assets/allfiles/icon_generated_method_speaker.svg'

interface TemplateItem {
  id: number
  templateCode: string
  templateName: string
  iconUrl: string
  categoryCode: string
  categoryName: string
  [key: string]: any
}

interface CategoryItem {
  dictCode: number
  dictLabel: string
  dictValue: string
  cssClass: string
  templates: TemplateItem[]
  [key: string]: any
}

interface ModelItem {
  description: string
  displayName: string
  vipLevel: string
}

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  initialModelId: {
    type: String,
    default: 'auto'
  },
  initialLanguageCode: {
    type: String,
    default: 'zh-CN'
  },
  initialDistinguishSpeaker: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:visible', 'confirm'])

const loginStore = useLoginStore()
const { t } = useI18n()

const isDialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const categoryList = ref<CategoryItem[]>([])
const activeCategoryCode = ref('')
const selectedTemplateCode = ref('')
const previewVisible = ref(false)
const previewTemplate = ref<TemplateItem | null>(null)
const modelList = ref<ModelItem[]>([])
const selectedModelId = ref(props.initialModelId)
const customTemplateVisible = ref(false)
const customTemplateName = ref('')
const customTemplatePrompt = ref('')
const customTemplateSaving = ref(false)
const selectedLanguageCode = ref(props.initialLanguageCode)
const distinguishSpeaker = ref(props.initialDistinguishSpeaker)

const activeTemplates = computed(() => {
  const cat = categoryList.value.find(c => c.dictValue === activeCategoryCode.value)
  return cat?.templates ?? []
})

const selectedModelName = computed(() => {
  if (selectedModelId.value === 'auto') return t('dialogs.summaryTemplate.auto')
  return selectedModelId.value
})

const previewMarkdownHtml = computed(() => {
  const text = previewTemplate.value?.previewPrompt ?? ''
  return text ? marked(text) : ''
})

const selectedLanguageName = computed(() => {
  const lang = languages.find(l => l.code === selectedLanguageCode.value)
  return lang?.name ?? t('dialogs.summaryTemplate.zhCNFallback')
})

function openPreview(tpl: TemplateItem) {
  previewTemplate.value = tpl
  previewVisible.value = true
}

function openCustomTemplateDialog() {
  customTemplateName.value = ''
  customTemplatePrompt.value = ''
  customTemplateVisible.value = true
}

function closeCustomTemplateDialog() {
  customTemplateVisible.value = false
}

async function saveCustomTemplate() {
  const templateName = customTemplateName.value?.trim()
  const previewPrompt = customTemplatePrompt.value?.trim()
  if (!templateName) {
    ElMessage.warning(t('dialogs.summaryTemplate.enterName'))
    return
  }
  if (!previewPrompt) {
    ElMessage.warning(t('dialogs.summaryTemplate.enterPrompt'))
    return
  }
  customTemplateSaving.value = true
  try {
    await addTemplate({
      createBy: String(loginStore.loginData.userId ?? ''),
      langCode: 'zh',
      templateName,
      previewPrompt
    })
    ElMessage.success(t('dialogs.summaryTemplate.createSuccess'))
    closeCustomTemplateDialog()
    fetchTemplates()
  } catch (e) {
    console.error('Add template failed:', e)
    ElMessage.error(t('dialogs.summaryTemplate.createFailed'))
  } finally {
    customTemplateSaving.value = false
  }
}

function handleModelSelect(command: string) {
  selectedModelId.value = command
}

function handleLanguageSelect(command: string) {
  selectedLanguageCode.value = command
}

async function fetchTemplates() {
  try {
    const userId = String(loginStore.loginData.userId ?? '')
    const res = await getSummaryTemplates({ userId })
    if (Array.isArray(res?.data)) {
      categoryList.value = res.data
      if (res.data.length && !activeCategoryCode.value) {
        activeCategoryCode.value = res.data[0].dictValue
      }
    }
  } catch (error) {
    console.error('Failed to fetch summary templates:', error)
  }
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
  if (val) {
    selectedModelId.value = props.initialModelId
    selectedLanguageCode.value = props.initialLanguageCode
    distinguishSpeaker.value = props.initialDistinguishSpeaker
    fetchTemplates()
    if (!modelList.value.length) {
      fetchModelList()
    }
  }
})

function handleConfirm() {
  emit('confirm', {
    templateCode: selectedTemplateCode.value,
    modelId: selectedModelId.value,
    platform: selectedModelId.value === 'auto' ? 'Auto' : selectedModelId.value,
    languageCode: selectedLanguageCode.value,
    distinguishSpeaker: distinguishSpeaker.value
  })
  closeDialog()
}

function closeDialog() {
  emit('update:visible', false)
}
</script>

<style scoped lang="scss">
.template-body {
  display: flex;
  height: 480px;
  gap: 20px;
}

.category-sidebar {
  width: 160px;
  flex-shrink: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.category-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f5f7fa;
  }

  &.active {
    background-color: #ecf5ff;

    .category-info span {
      color: #409eff;
      font-weight: 500;
    }

    .category-arrow {
      color: #409eff;
    }
  }

  .category-info {
    display: flex;
    align-items: center;
    gap: 8px;

    span {
      font-size: 14px;
      color: #333;
    }
  }

  .category-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  .category-arrow {
    font-size: 12px;
    color: #ccc;
  }
}

.template-grid-area {
  flex: 1;
  overflow-y: auto;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.template-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #e8e8e8;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;

  &:hover {
    border-color: #a0cfff;
    background: #f0f5ff;
  }

  &.selected {
    border-color: #409eff;
    background: #ecf5ff;
  }

  .hint-icon {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 16px;
    height: 16px;
    cursor: pointer;
    opacity: 0.5;
    transition: opacity 0.2s;

    &:hover {
      opacity: 1;
    }
  }

  .template-icon {
    width: 48px;
    height: 48px;
    margin-bottom: 12px;
  }

  .template-name {
    font-size: 13px;
    color: #333;
    text-align: center;
  }

  &.template-card-create {
    .create-plus-icon {
      font-size: 32px;
      color: #409eff;
      margin-bottom: 12px;
    }
  }
}

.custom-template-form {
  .form-item {
    margin-bottom: 20px;

    .form-label {
      display: block;
      font-size: 14px;
      color: #333;
      margin-bottom: 8px;
    }
  }
}

.preview-content {
  .preview-label {
    font-size: 13px;
    color: #999;
    margin-bottom: 10px;
  }

  .preview-editor {
    box-shadow: none !important;
    font-size: 14px;
    line-height: 1.6;
    color: #333;

    :deep(h1, h2, h3, h4, h5, h6) {
      margin-top: 16px;
      margin-bottom: 16px;
      font-weight: 600;
      line-height: 1.25;
    }

    :deep(h1) {
      font-size: 1.5em;
    }

    :deep(h2) {
      font-size: 1.25em;
    }

    :deep(p) {
      margin-bottom: 12px;
    }

    :deep(ul, ol) {
      padding-left: 1.5em;
      margin-bottom: 12px;
    }

    :deep(li) {
      margin-bottom: 0.25em;
    }
  }
}

.template-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  font-size: 14px;
}

.template-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.footer-settings {
  display: flex;
  align-items: center;
  gap: 16px;
}

.footer-setting-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  cursor: pointer;
  font-size: 13px;

  .footer-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  .footer-setting-text {
    display: flex;
    flex-direction: column;
    line-height: 1.3;
  }

  .footer-label {
    font-size: 11px;
    color: #999;
  }

  .footer-value {
    font-size: 13px;
    color: #333;
  }

  .footer-arrow {
    font-size: 12px;
    color: #ccc;
  }
}

.confirm-button {
  height: 44px;
  padding: 0 40px;
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
/** 纪要模板主弹窗外壳 */
.summary-template-dialog.generate-modal.el-dialog {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  max-width: 90vw;
  max-height: 90vh;
  box-sizing: border-box;
  overflow: hidden;
}

.summary-template-dialog.generate-modal.el-dialog .el-dialog__header {
  padding: 0;
  margin: 0;
}

.summary-template-dialog.generate-modal.el-dialog .el-dialog__body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
}

.summary-template-dialog.generate-modal.el-dialog .el-dialog__footer {
  padding: 0;
  margin-top: 16px;
}

.template-preview-dialog {
  .el-dialog {
    border-radius: 16px;
  }

  .el-dialog__body {
    max-height: 70vh;
    overflow-y: auto;
  }
}
</style>
