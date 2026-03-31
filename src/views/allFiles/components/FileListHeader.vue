<template>
  <div class="l2-header">
    <div class="l2-header-left">
      <ShowMainNav />
      <!-- 标题 -->
      <h3>
        {{ pageTitle }}<span>({{ listLength }})</span>
      </h3>
    </div>
    <div class="l2-header-right">
      <!-- 更新时间 -->
      <el-dropdown @command="handleSortChange" class="time-menu">
        <div class="sort-control">
          <span>{{ currentSortText }}</span>
          <img src="@/assets/images/icon_second_time_sorting.svg" alt="sort-time" />
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="creationTime">
              <span class="dropdown-item-text">
                {{ t('layout.header.sortOptions.creationTime') }}
              </span>
              <img
                v-if="currentSortOption === 'creationTime'"
                class="check-icon"
                :src="iconChooseFile"
                alt="check"
              />
            </el-dropdown-item>
            <el-dropdown-item command="updateTime">
              <span class="dropdown-item-text">
                {{ t('layout.header.sortOptions.updateTime') }}
              </span>
              <img
                v-if="currentSortOption === 'updateTime'"
                class="check-icon"
                :src="iconChooseFile"
                alt="check"
              />
            </el-dropdown-item>
            <el-dropdown-item command="recentlyOpened">
              <span class="dropdown-item-text">
                {{ t('layout.header.sortOptions.recentlyOpened') }}
              </span>
              <img
                v-if="currentSortOption === 'recentlyOpened'"
                class="check-icon"
                :src="iconChooseFile"
                alt="check"
              />
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <!-- 收起 -->
      <img
        src="@/assets/images/icon_second_menu_button.svg"
        alt="switch"
        class="switch-icon"
        @click="uiStore.toggleL2Aside(false)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ElDropdown, ElDropdownItem, ElDropdownMenu } from 'element-plus'
import iconChooseFile from '@/assets/images/icon_choose_file.svg'
import { useUiStore } from '@/stores/ui'
import ShowMainNav from '@/components/showMainNav.vue'

const props = defineProps<{
  listLength: number
}>()

const emit = defineEmits<{
  'sort-change': [sortType: number]
}>()

const { t } = useI18n()
const route = useRoute()
const uiStore = useUiStore()

const currentSortOption = ref('updateTime')

const pageTitle = computed(() => {
  const type = route.query.type
  const config = {
    all: t('layout.header.allFiles'),
    unclassified: t('layout.sidebar.uncategorized'),
    recycle: t('layout.sidebar.recycleBin'),
    folders: t('layout.sidebar.folders'),
    import: t('layout.sidebar.import'),
  }
  return config[type as keyof typeof config]
})

const currentSortText = computed(() => {
  switch (currentSortOption.value) {
    case 'creationTime':
      return t('layout.header.sortOptions.creationTime')
    case 'updateTime':
      return t('layout.header.sortOptions.updateTime')
    case 'recentlyOpened':
      return t('layout.header.sortOptions.recentlyOpened')
    default:
      return t('layout.header.updateTime')
  }
})

const sortType = computed(() => {
  switch (currentSortOption.value) {
    case 'creationTime':
      return 1
    case 'updateTime':
      return 2
    case 'recentlyOpened':
      return 3
    default:
      return 1
  }
})

function handleSortChange(command: string) {
  currentSortOption.value = command
  emit('sort-change', sortType.value)
}
</script>

<style lang="scss" scoped>
.l2-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 10px;
  flex-shrink: 0;

  .l2-header-left {
    display: flex;
    align-items: center;
    gap: 15px;

    .show-l1-icon {
      cursor: pointer;
      transform: rotate(180deg);
      width: 18px;
      height: 18px;
    }

    h3 {
      margin: 0;
      font-size: 18px;

      span {
        color: #9a9a9a;
        margin-left: 3px;
      }
    }
  }

  .l2-header-right {
    display: flex;
    align-items: center;
    gap: 15px;

    .select-mode-icon {
      width: 15px;
      height: 15px;
      cursor: pointer;
    }

    .sort-control {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 16px;
      color: #9a9a9a;
      cursor: pointer;
    }

    img {
      cursor: pointer;
    }
  }
}

.time-menu {
  :deep(.el-dropdown-menu) {
    padding: 4px 0;

    .el-dropdown-menu__item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 16px;

      .dropdown-item-text {
        flex: 1;
      }

      .check-icon {
        width: 16px;
        height: 16px;
      }
    }
  }
}
</style>
