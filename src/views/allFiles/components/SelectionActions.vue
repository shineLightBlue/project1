<template>
  <div class="selection-center">
    <div class="action-btn" @click="handleMerge" v-show="!isRecycle">
      <img :src="loadSvg('icon_file_list_merge')" alt="merge" class="btn-icon" />
      <span>{{ t('layout.secondaryNav.selection.merge') }}</span>
    </div>
    <div class="action-btn" @click.stop="handleMoveToFolder" v-show="!isRecycle">
      <img :src="loadSvg('icon_file_list_move_to')" alt="move" class="btn-icon" />
      <span>{{ t('layout.secondaryNav.selection.moveToFolder') }}</span>
    </div>
    <div class="action-btn btn-delete" @click="handleDelete" v-show="!isRecycle">
      <img :src="loadSvg('icon_file_list_delete')" alt="delete" class="btn-icon" />
      <span>{{ t('layout.secondaryNav.selection.delete') }}</span>
    </div>
    <div class="action-btn" @click="handleRestore" v-show="isRecycle">
      <img :src="loadSvg('icon_file_list_restore')" alt="move" class="btn-icon" />
      <span>{{ t('layout.secondaryNav.selection.restore') }}</span>
    </div>
    <div class="action-btn btn-delete" @click="handlePermanentDelete" v-show="isRecycle">
      <img :src="loadSvg('icon_file_list_delete')" alt="move" class="btn-icon" />
      <span>{{ t('layout.secondaryNav.selection.permanentDelete') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { loadSvg } from '@/utils'

const emit = defineEmits<{
  merge: []
  'move-to-folder': [event: MouseEvent]
  delete: []
  restore: []
  'permanent-delete': []
}>()

const { t } = useI18n()
const route = useRoute()

// 判断是否在回收站
const isRecycle = computed(() => route.query.type === 'recycle')

function handleMerge() {
  emit('merge')
}

function handleMoveToFolder(event: MouseEvent) {
  emit('move-to-folder', event)
}

function handleDelete() {
  emit('delete')
}

function handleRestore() {
  emit('restore')
}

function handlePermanentDelete() {
  emit('permanent-delete')
}
</script>

<style lang="scss" scoped>
.selection-center {
  margin-left: 10px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;

  .action-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 0;
    min-width: 98px;
    border-radius: 6px;
    background: #eaeaea;
    color: #333;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition:
      background 0.2s,
      transform 0.1s;
    border: none;
    user-select: none;
    justify-content: center;

    &:hover {
      background: #dbdbdb;
    }

    &:active {
      background: #dadada;
      transform: translateY(1px);
    }

    .btn-icon {
      width: 12px;
      height: 12px;
      flex-shrink: 0;
    }

    &.btn-delete {
      color: #ff2020;
    }
  }
}
</style>
