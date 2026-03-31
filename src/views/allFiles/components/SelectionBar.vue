<template>
  <div class="selection-bar">
    <div class="selection-left" @click="handleToggleSelectAll">
      <img :src="selectionIcon" alt="selection" class="selection-icon" />
      <span class="selection-text">
        {{ t('layout.secondaryNav.selection.selected') }} ({{ selectedCount }})
      </span>
    </div>
    <div class="selection-right">
      <span class="selection-btn" @click="handleDone">
        {{ t('layout.secondaryNav.selection.done') }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { loadSvg } from '@/utils'

const props = defineProps<{
  selectedCount: number
  totalCount: number
}>()

const emit = defineEmits<{
  'toggle-select-all': []
  done: []
}>()

const { t } = useI18n()

// 选择状态图标
const selectionIcon = computed(() => {
  if (props.selectedCount === 0) {
    return loadSvg('icon_file_list_unselected')
  } else if (props.selectedCount === props.totalCount) {
    return loadSvg('icon_file_list_selected')
  } else {
    return loadSvg('icon_file_list_partially_selected')
  }
})

function handleToggleSelectAll() {
  emit('toggle-select-all')
}

function handleDone() {
  emit('done')
}
</script>

<style lang="scss" scoped>
.selection-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 55px;
  background-color: #f8f9fa;
  border-top: 1px solid #e1e8f0;
  padding: 0 10px;
  flex-shrink: 0;

  .selection-left {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;

    .selection-icon {
      width: 15px;
      height: 15px;
      flex-shrink: 0;
    }

    .selection-text {
      font-size: 14px;
      color: #333;
    }
  }

  .selection-right {
    .selection-btn {
      font-size: 16px;
      font-weight: 500;
      color: #1890ff;
      cursor: pointer;
      user-select: none;

      &:hover {
        color: #096dd9;
      }
    }
  }
}
</style>