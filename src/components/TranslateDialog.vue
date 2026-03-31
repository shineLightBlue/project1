<template>
  <el-dialog
    v-model="isDialogVisible"
    :title="t('dialogs.translate.title')"
    width="400px"
    :show-close="true"
    @close="closeDialog"
  >
    <div class="dialog-content">
      <el-input v-model="searchTerm" :placeholder="t('dialogs.translate.searchPlaceholder')" clearable class="search-input">
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <div class="language-list">
        <div
          v-for="lang in filteredLanguages"
          :key="lang.code"
          class="language-item"
          :class="{ selected: lang.code === selectedLanguage }"
          @click="selectLanguage(lang.code)"
        >
          {{ lang.cn }}
          <el-icon v-if="lang.code === selectedLanguage" class="selected-icon"><Check /></el-icon>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElDialog, ElInput, ElIcon } from 'element-plus'
import { Search, Check } from '@element-plus/icons-vue'
import languages from '@/constants/languages.json'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'translate'])

const { t } = useI18n()

const isDialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const searchTerm = ref('')
const selectedLanguage = ref('zh') // Default to Chinese

const filteredLanguages = computed(() => {
  if (!searchTerm.value) {
    return languages
  }
  return languages.filter((lang) =>
    lang.cn.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
    lang.en.toLowerCase().includes(searchTerm.value.toLowerCase())
  )
})

function selectLanguage(code: string) {
  selectedLanguage.value = code
  emit('translate', code)
  closeDialog()
}

function closeDialog() {
  emit('update:visible', false)
}
</script>

<style scoped lang="scss">
.dialog-content {
  .search-input {
    margin-bottom: 15px;
  }

  .language-list {
    max-height: 300px;
    overflow-y: auto;

    .language-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px;
      cursor: pointer;
      border-radius: 4px;

      &:hover {
        background-color: #f5f5f5;
      }

      &.selected {
        color: #409eff;
        font-weight: bold;
      }
    }
  }
}
</style>
