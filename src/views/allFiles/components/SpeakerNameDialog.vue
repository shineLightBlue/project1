<template>
  <div v-if="visible" class="speaker-name-dialog">
    <div class="dialog-header">
      <span class="dialog-title">{{ t('layout.headerRight.moreMenu.findAndReplace') }}</span>
      <img class="pointer" src="@/assets/images/icon_close.svg" alt="" @click="handleClose" />
    </div>

    <div class="dialog-body">
      <!-- 查找 -->
      <div class="form-row">
        <div class="flex search-section">
          <div class="form-label">{{ t('layout.headerRight.findAndReplaceModal.find') }}</div>
          <div class="pagination">
            <button class="pagination-btn" @click="prevMatch" :disabled="totalMatches === 0">
              <img src="@/assets/images/icon_minutes_left_arrow.svg" alt="" />
            </button>
            <span class="pagination-text">{{ currentIndex }}/{{ totalMatches }}</span>
            <button class="pagination-btn" @click="nextMatch" :disabled="totalMatches === 0">
              <img class="right-arrow" src="@/assets/images/icon_minutes_left_arrow.svg" alt="" />
            </button>
          </div>
        </div>
        <div class="input-wrapper">
          <input
            v-model="searchText"
            type="text"
            class="form-input"
            :placeholder="t('layout.headerRight.findAndReplaceModal.searchPlaceholder')"
            @input="debouncedHandleInput"
            @keyup.enter="handleEnter"
          />
        </div>
      </div>

      <!-- 替换为 -->
      <div class="form-row">
        <div class="replace">{{ t('layout.headerRight.findAndReplaceModal.replaceWith') }}</div>
        <textarea
          v-model="replaceText"
          type="text"
          class="form-input replace-input"
          :placeholder="t('layout.headerRight.findAndReplaceModal.replacePlaceholder')"
          @keyup.enter="handleReplace"
        />
      </div>
    </div>

    <!-- 底部按钮 -->
    <div class="dialog-footer">
      <el-button
        class="btn btn-secondary"
        :class="{ active: searchText.trim() }"
        @click="handleReplaceAll"
        :disabled="loadingStore.isLoading"
      >
        {{ t('layout.headerRight.findAndReplaceModal.replaceAll') }}
      </el-button>
      <el-button
        class="btn btn-primary"
        :class="{ active: searchText.trim() }"
        @click="handleReplace"
        :disabled="loadingStore.isLoading"
      >
        {{ t('layout.headerRight.findAndReplaceModal.replace') }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { debounce } from '@/utils'
import { useLoadingStore } from '@/stores/loading.ts'

const { t } = useI18n()

interface Props {
  visible: boolean
  totalMatches: number
  currentIndex: number
}

interface Emits {
  (e: 'close'): void

  (e: 'replace', data: { oldName: string; newName: string; matchIndex: number }): void

  (e: 'replaceAll', data: { oldName: string; newName: string }): void

  (e: 'search', text: string, isEnterKey?: boolean): void

  (e: 'navigate', direction: 'prev' | 'next')
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 搜索文本
const searchText = ref('')
// 替换文本
const replaceText = ref('')

const loadingStore = useLoadingStore()

// 处理关闭
function handleClose() {
  searchText.value = ''
  emit('close')
}

const debouncedHandleInput = debounce(() => {
  console.log(searchText.value.trim(), 'input search')
  emit('search', searchText.value.trim(), false) // false 表示不是按回车
}, 300)

// 处理回车键
function handleEnter() {
  console.log(searchText.value.trim(), 'enter key')
  emit('search', searchText.value.trim(), true) // true 表示是按回车
}

// 查找匹配项
function handleFind() {
  console.log(searchText.value.trim(), 'search')
  emit('search', searchText.value.trim())
}

// 上一个匹配
function prevMatch() {
  if (props.totalMatches === 0) return
  emit('navigate', 'prev')
}

// 下一个匹配
function nextMatch() {
  if (props.totalMatches === 0) return
  emit('navigate', 'next')
}

// 替换当前匹配
function handleReplace() {
  if (!searchText.value.trim()) {
    // 可以显示提示
    return
  }
  if (!props.currentIndex) {
    return
  }

  emit('replace', {
    oldName: searchText.value,
    newName: replaceText.value,
    matchIndex: props.currentIndex - 1, // 转换为 0-based 索引
  })
}

// 全部替换
function handleReplaceAll() {
  if (!searchText.value.trim()) {
    // 可以显示提示
    return
  }
  if (!props.currentIndex) {
    return
  }

  emit('replaceAll', {
    oldName: searchText.value,
    newName: replaceText.value,
  })
}
</script>

<style scoped>
.speaker-name-dialog {
  position: absolute;
  top: 50px;
  right: 146px;
  width: 350px;
  box-sizing: border-box;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 7px 31px 5px rgba(43, 43, 43, 0.15);
  padding: 20px;
  z-index: 1000;
  font-size: 14px;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.dialog-title {
  font-size: 14px;
  font-weight: 600;
}

.dialog-body {
  .search-section {
    margin-bottom: 5px;
    justify-content: space-between;
  }

  .replace {
    margin-bottom: 5px;
  }
}

.input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-input {
  flex: 1;
  height: 35px;
  box-sizing: border-box;
  padding: 0 12px;
  border: 1px solid #dcdbdb;
  border-radius: 6px;
  font-size: 14px;
  margin-bottom: 20px;
  transition: all 0.2s;

  &.replace-input {
    height: 93px;
    width: 100%;
    resize: none;
    box-sizing: border-box;
    padding: 8px 12px;
  }
}

.form-input:focus {
  outline: none;
  border-color: #1a73e8;
  box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.2);
}

.form-input::placeholder {
  color: #999;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 8px;
}

.pagination-btn {
  width: 18px;
  height: 18px;
  box-sizing: border-box;
  border: none;
  background: #fff;
  border-radius: 4px;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  .right-arrow {
    transform: rotate(180deg);
  }
}

.pagination-btn:hover:not(:disabled) {
  background: #c4c4c4;
  color: #333;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-text {
  font-size: 12px;
  color: #666;
  min-width: 40px;
  text-align: center;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.btn {
  flex: 1;
  height: 36px;
  padding: 0 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: #fff;
  border: 1px solid #dcdbdb;
  box-sizing: border-box;
  color: #7f7f7f;
}

.btn-secondary.active {
  color: #000;
}

.btn-primary {
  background: rgba(0, 117, 255, 0.2);
  color: #fff;
}

.btn-primary.active {
  background: rgba(0, 117, 255, 1);
}
</style>
