<template>
  <div
    v-show="visible && isSelectionMode"
    class="file-context-menu"
    :style="{ left: adjustedPosition.x + 'px', top: adjustedPosition.y + 'px' }"
    @click.stop
  >
    <div v-if="!isRecycle" class="context-menu-item" @click="handleCommand('select')">
      {{ t('layout.secondaryNav.contextMenu.select') }}
    </div>
    <div v-if="!isRecycle" class="context-menu-item" @click="handleCommand('rename')">
      {{ t('layout.secondaryNav.contextMenu.rename') }}
    </div>
    <div v-if="!isRecycle" class="context-menu-item" @click="handleCommand('move')">
      {{ t('layout.secondaryNav.contextMenu.move') }}
    </div>
    <div
      v-if="!isRecycle"
      class="context-menu-item context-menu-item-danger"
      @click="handleCommand('delete')"
    >
      {{ t('layout.secondaryNav.contextMenu.moveToRecycleBin') }}
    </div>
    <div v-if="isRecycle" class="context-menu-item" @click="handleCommand('select')">
      {{ t('layout.secondaryNav.contextMenu.select') }}
    </div>
    <div v-if="isRecycle" class="context-menu-item" @click="handleCommand('restore')">
      {{ t('layout.secondaryNav.contextMenu.restore') }}
    </div>
    <div
      v-if="isRecycle"
      class="context-menu-item context-menu-item-danger"
      @click="handleCommand('permanentDelete')"
    >
      {{ t('layout.secondaryNav.contextMenu.permanentDelete') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  visible: boolean
  isSelectionMode: boolean
  position: { x: number; y: number }
}>()

const emit = defineEmits<{
  command: [command: string]
}>()

const { t } = useI18n()
const route = useRoute()

const isRecycle = computed(() => route.query.type === 'recycle')

// 菜单尺寸常量
const MENU_WIDTH = 178
const MENU_ITEM_HEIGHT = 40
const MENU_PADDING = 10

// 计算菜单实际高度（根据当前显示的菜单项数量）
const menuHeight = computed(() => {
  let itemCount = 0
  if (!isRecycle.value) {
    itemCount = 4 // select, rename, move, delete
  } else {
    itemCount = 3 // select, restore, permanentDelete
  }
  return MENU_ITEM_HEIGHT * itemCount + MENU_PADDING * 2
})

// 智能定位：确保菜单不会超出视口
const adjustedPosition = computed(() => {
  const { x, y } = props.position
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  let adjustedX = x
  let adjustedY = y

  // 检测是否会超出右边界
  if (x + MENU_WIDTH > viewportWidth) {
    adjustedX = x - MENU_WIDTH - 10 // 向左偏移，留出 10px 间距
  }

  // 检测是否会超出底部边界
  if (y + menuHeight.value > viewportHeight) {
    adjustedY = y - menuHeight.value // 向上偏移
  }

  // 确保不会超出左边界
  if (adjustedX < 0) {
    adjustedX = 10
  }

  // 确保不会超出顶部边界
  if (adjustedY < 0) {
    adjustedY = 10
  }

  return { x: adjustedX, y: adjustedY }
})

function handleCommand(command: string) {
  emit('command', command)
}
</script>

<style lang="scss" scoped>
.file-context-menu {
  position: fixed;
  background-color: #fff;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 178px;
  box-sizing: border-box;
  padding: 5px;
  z-index: 9999;
  border: 1px solid #e0e0e0;

  .context-menu-item {
    padding: 8px 16px;
    font-size: 12px;
    color: #000;
    cursor: pointer;
    transition: background-color 0.2s;
    margin-bottom: 5px;
    border-radius: 4px;

    &:hover {
      background-color: #ecebeb;
    }

    &-danger {
      color: #ff2020;
    }
  }
}
</style>
