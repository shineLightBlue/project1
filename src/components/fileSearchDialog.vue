<template>
  <el-dialog
    v-model="dialogVisible"
    width="487px"
    :show-close="false"
    destroy-on-close
    class="file-search-dialog"
    @close="handleClose"
  >
    <div class="search-content flex-center">
      <!-- 搜索输入框 -->
      <div class="search-input-wrapper">
        <!-- 搜索图标 -->
        <img src="@/assets/images/icon_search.svg" alt="" class="search-icon" />

        <!-- 输入框 -->
        <input
          v-model="searchValue"
          type="text"
          class="search-input"
          :placeholder="t('layout.sidebar.searchModal.inputPlaceholder')"
          @input="debouncedHandleInput"
        />
      </div>
      <!-- 清除按钮 -->
      <img
        @click="handleClose"
        src="@/assets/images/icon_close.svg"
        alt=""
        class="clear-icon pointer"
      />
    </div>
    <!-- 搜索结果区域 -->
    <div v-if="searchValue" class="search-results">
      <!-- 这里可以添加搜索结果展示逻辑 -->
      <div v-if="loading && pageNum === 1" class="loading-text">
        {{ t('layout.sidebar.searchModal.searching') }}
      </div>
      <div v-else-if="searchResults.length === 0" class="empty-text">
        {{ t('layout.sidebar.searchModal.noResults') }}
      </div>
      <el-scrollbar v-else ref="scrollbarRef" height="400px" @end-reached="handleScroll">
        <div class="results-container">
          <div
            v-for="(item, index) in searchResults"
            :key="item.id || index"
            class="update-log-item"
          >
            <div class="log-title" v-html="highlightKeyword(item.title, searchValue)"></div>
            <div
              class="log-description ellipsis-2"
              v-html="highlightKeyword(item.mainTextSnippet, searchValue)"
            ></div>
            <div class="log-metadata">
              <span class="note-tag" v-if="false">Note</span>
              <img src="@/assets/images/icon_search_date.svg" alt="" />
              <span class="log-time">{{ item.fileTime }}</span>
            </div>
          </div>
          <div v-if="loading && pageNum > 1" class="loading-more">
            <el-icon class="is-loading">
              <Loading />
            </el-icon>
            加载中...
          </div>
          <div v-if="noMore && searchResults.length > 0" class="no-more-text">没有更多数据了</div>
        </div>
      </el-scrollbar>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { apiSearchKeyword } from '@/api'
import { useLoginStore } from '@/stores/login.ts'
import { debounce } from '@/utils'
import { useI18n } from 'vue-i18n'
import { Loading } from '@element-plus/icons-vue'
import { watch } from 'vue'

const dialogVisible = defineModel()
const searchValue = ref('')
const loading = ref(false)
const searchResults = ref([])
const { t } = useI18n()

const loginStore = useLoginStore()

const pageNum = ref(1)
const pageSize = ref(3)
const noMore = ref(false)
const scrollbarRef = ref()

// 创建防抖函数实例
const debouncedHandleInput = debounce(handleInput, 300)

function handleScroll() {
  // 距离底部小于阈值且未在加载中且还有更多数据时，触发加载
  if (!loading.value && !noMore.value) {
    pageNum.value++
    loadData()
  }
}

// 监听搜索值变化，重置分页状态
watch(
  () => searchValue.value,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      // 搜索值变化时重置状态
      pageNum.value = 1
      noMore.value = false
      searchResults.value = []
    }
  },
)

/**
 * 高亮搜索词
 * @param text 原始文本
 * @param keyword 搜索关键词
 * @returns 高亮后的 HTML 字符串
 */
function highlightKeyword(text: string, keyword: string): string {
  if (!keyword || !text) return text
  const regex = new RegExp(`(${escapeRegExp(keyword)})`, 'gi')
  return text.replace(regex, '<span style="background-color: #B2CEFF;">$1</span>')
}

/**
 * 转义正则表达式特殊字符
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function loadData() {
  loading.value = true
  try {
    const res = await apiSearchKeyword({
      keyword: searchValue.value,
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      userId: loginStore.loginData.userId,
    })

    if (pageNum.value === 1) {
      searchResults.value = res.data
    } else {
      searchResults.value.push(...res.data)
    }

    noMore.value = res.data.length !== pageSize.value
  } catch (error) {
    console.error('搜索失败:', error)
  } finally {
    loading.value = false
  }
}

async function handleInput() {
  if (!searchValue.value.trim()) {
    return
  }
  pageNum.value = 1
  noMore.value = false
  await loadData()
}

/**
 * 关闭
 */
function handleClose() {
  dialogVisible.value = false
  // 清空搜索内容和结果
  searchValue.value = ''
  searchResults.value = []
  pageNum.value = 1
  noMore.value = false
}
</script>

<style lang="scss" scoped>
.search-content {
  gap: 15px;

  .search-input-wrapper {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    width: 100%;
    height: 40px;
    padding: 0 20px;
    background: #ffffff;
    border: 1px solid #9a9a9a;
    border-radius: 6px;
    transition: all 0.3s ease;

    &:focus-within {
      border-color: #1890ff;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
    }

    .search-icon {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      margin-right: 10px;
    }

    .search-input {
      flex: 1;
      height: 100%;
      border: none;
      outline: none;
      background: transparent;
      font-size: 14px;
      line-height: 22px;
      color: #000;
      font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
      font-weight: 400;

      &::placeholder {
        color: #bdbdbd;
      }
    }
  }
}

.search-results {
  color: #000;
  margin-top: 20px;
  min-height: 300px;
  max-height: 600px;
  overflow-y: auto;
  border-radius: 6px;

  .loading-text,
  .empty-text {
    text-align: center;
    padding: 40px 20px;
    color: #999;
    font-size: 14px;
  }

  .results-container {
    .loading-more,
    .no-more-text {
      text-align: center;
      padding: 20px;
      color: #999;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;

      .is-loading {
        animation: rotating 2s linear infinite;
      }
    }
  }

  @keyframes rotating {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .results-list {
    .result-item {
      padding: 12px 16px;
      cursor: pointer;
      transition: background-color 0.2s;
      font-size: 14px;
      color: #333;

      &:hover {
        background-color: #f5f7fa;
      }

      &:not(:last-child) {
        border-bottom: 1px solid #f0f0f0;
      }
    }
  }
}

.update-log-item {
  padding: 115px 0;
  font-size: 12px;
  border-radius: 8px;
  transition: background-color 0.2s;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;

  &:nth-last-child(1) {
    border-bottom: none;
  }

  .log-title {
    font-weight: 400;
    margin-bottom: 8px;
    font-family: 'PingFang SC', 'Microsoft YaHei', 'Segoe UI', sans-serif;
  }

  .log-description {
    font-weight: 400;
    line-height: 1.6;
    margin-bottom: 8px;
    font-family: 'PingFang SC', 'Microsoft YaHei', 'Segoe UI', sans-serif;
  }

  .log-metadata {
    display: flex;
    align-items: center;
    gap: 5px;

    .note-tag {
      display: inline-flex;
      align-items: center;
      background-color: #e3f2fd;
      color: #1976d2;
      border-radius: 4px;
      padding: 2px 8px;
      font-size: 12px;
      font-weight: 500;
    }

    .log-time,
    .log-duration,
    .log-update-time {
      color: #9a9a9a;
      font-size: 12px;
      font-family: 'PingFang SC', 'Microsoft YaHei', 'Segoe UI', sans-serif;
    }
  }
}
</style>

<style lang="scss">
.file-search-dialog {
  padding: 20px !important;

  .el-dialog__header {
    padding-bottom: 0 !important;
  }
}
</style>
