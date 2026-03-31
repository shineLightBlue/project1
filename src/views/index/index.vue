<template>
  <el-container class="common-layout">
    <el-aside :width="uiStore.isL1AsideVisible ? '247px' : '0'" class="aside">
      <div class="aside-content-wrapper">
        <div class="aside-top">
          <div class="logo">
            <div class="logo-left">
              <img :src="loadSvg('icon_logo')" alt="logo" />
              <img :src="loadSvg('icon_notra')" alt="boya-notra" />
            </div>
            <img
              :src="loadSvg('icon_switch')"
              alt="switch"
              class="switch-icon"
              @click="uiStore.toggleL1Aside(false)"
            />
          </div>
          <!-- 用户信息 -->
          <div class="user-info">
            <img :src="userAvatar" @error="handleAvatarError" alt="" />
            <span>{{ displayName }}</span>
          </div>
          <!-- 导入音频 -->
          <el-button class="custom-btn" @click="openImportAudioModal">
            <img :src="loadSvg('icon_import_audio')" alt="import" />
            <span>{{ t('layout.sidebar.importAudio') }}</span>
          </el-button>
          <!-- 搜索 -->
          <el-button class="custom-btn" @click="fileSearchShow = true">
            <img :src="loadSvg('icon_search')" alt="search" />
            <span>{{ t('layout.sidebar.search') }}</span>
          </el-button>
        </div>
        <!-- 全部文件/未分类/回收站 -->
        <el-menu :default-active="$route.fullPath" class="menu" router>
          <el-menu-item
            index="/?type=all"
            @mouseenter="hoveredIcons.all = true"
            @mouseleave="hoveredIcons.all = false"
          >
            <img
              :src="
                $route.fullPath === '/?type=all' || hoveredIcons.all
                  ? loadSvg('icon_all_files_hover')
                  : loadSvg('icon_all_files')
              "
              alt="all_files"
            />
            <template #title>
              <span>{{ t('layout.sidebar.allFiles') }}</span>
            </template>
          </el-menu-item>
          <el-menu-item
            index="/?type=unclassified"
            @mouseenter="hoveredIcons.unclassified = true"
            @mouseleave="hoveredIcons.unclassified = false"
          >
            <img
              :src="
                $route.fullPath === '/?type=unclassified' || hoveredIcons.unclassified
                  ? loadSvg('icon_unclassified_hover')
                  : loadSvg('icon_unclassified')
              "
              alt="unclassified"
            />
            <template #title>
              <span>{{ t('layout.sidebar.uncategorized') }}</span>
            </template>
          </el-menu-item>
          <el-menu-item
            index="/?type=recycle"
            @mouseenter="hoveredIcons.recycle = true"
            @mouseleave="hoveredIcons.recycle = false"
          >
            <img
              :src="
                $route.fullPath === '/?type=recycle' || hoveredIcons.recycle
                  ? loadSvg('icon_recycle_hover')
                  : loadSvg('icon_recycle')
              "
              alt="recycle"
            />
            <template #title>
              <span>{{ t('layout.sidebar.recycleBin') }}</span>
            </template>
          </el-menu-item>
        </el-menu>
        <!-- 文件夹模块 -->
        <div class="folder-section flex-center">
          <div>{{ t('layout.sidebar.folders') }}</div>
          <img
            class="arrow"
            :class="{ 'arrow-rotated': isFolderExpanded }"
            :src="loadSvg('icon_up_down_arrows')"
            alt=""
            @click="isFolderExpanded = !isFolderExpanded"
          />
          <div class="flex1"></div>
          <!-- 新建文件夹 -->
          <tooltip :content="t('layout.sidebar.addFolder')">
            <img class="pointer" :src="loadSvg('icon_new_folder')" alt="" @click="newFolders" />
          </tooltip>
        </div>
        <!-- 文件夹列表 -->
        <div class="folder-list" v-show="isFolderExpanded">
          <!-- 引入 SVG 雪碧图组件 -->
          <SpriteSvg />
          <el-menu :default-active="$route.fullPath" class="menu" router>
            <el-menu-item
              v-for="item in folderList"
              :key="item.id"
              :index="'/?type=folders&parentId=' + item.id"
            >
              <svg class="svg-icon" :style="{ color: getColor(item.color) }">
                <use :href="'#' + item.icon"></use>
              </svg>
              <div class="flex1 ellipsis">{{ item.name }}</div>
              <Tooltip :content="t('common.moreActions')">
                <div class="flex-center more" @click.stop="edit(item)">
                  <img :src="loadSvg('icon_more_operations')" alt="" />
                </div>
              </Tooltip>
            </el-menu-item>
          </el-menu>
        </div>
        <!-- 来自模块 -->
        <div class="folder-section flex-center">
          <div>{{ t('layout.sidebar.sources') }}</div>
          <img
            class="arrow"
            :class="{ 'arrow-rotated': isSourcesExpanded }"
            :src="loadSvg('icon_up_down_arrows')"
            alt=""
            @click="isSourcesExpanded = !isSourcesExpanded"
          />
        </div>
        <!-- 来自列表 -->
        <div v-show="isSourcesExpanded">
          <el-menu :default-active="$route.fullPath" class="menu" router>
            <el-menu-item index="/?type=import">{{ t('layout.sidebar.import') }}</el-menu-item>
          </el-menu>
        </div>
        <!-- 底部 -->
        <div class="aside-bottom">
          <!-- 会员信息 -->
          <div class="member" @click="goMembershipCenter">
            <div class="name">{{ displayMemberName }}</div>
            <div v-if="showUsage" class="percent">
              <div class="percent-fill" :style="{ width: `${memberProgressPercent}%` }"></div>
            </div>
            <div v-if="showUsage" class="mes">
              {{
                isUnlimited
                  ? t('layout.sidebar.usageUnlimited', { used: usedMinutes })
                  : t('layout.sidebar.usage', { used: usedMinutes, total: totalMinutes })
              }}
            </div>
          </div>
          <!-- 帮助与客服、设置 -->
          <el-menu :default-active="$route.path" class="menu menu-bottom" router>
            <el-menu-item index="/settings/help-feedback">
              <img :src="loadSvg('icon_customer_service_help')" alt="help" />
              <template #title>
                <span>{{ t('layout.sidebar.help') }}</span>
              </template>
            </el-menu-item>
            <el-menu-item index="/settings/profile">
              <img :src="loadSvg('icon_setting')" alt="settings" />
              <template #title>
                <span>{{ t('layout.sidebar.settings') }}</span>
              </template>
            </el-menu-item>
          </el-menu>
        </div>
      </div>
    </el-aside>

    <el-container>
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>

    <ImportAudioModal v-model="isImportAudioModalVisible" />
  </el-container>
  <!-- 新建、编辑文件夹弹窗 -->
  <CreateNewFolders
    v-model="newFoldersShow"
    @close="getFolderList"
    :isEdit="isFolderEdit"
    :editData="folderData"
  />
  <!-- 搜索弹窗 -->
  <file-search-dialog v-model="fileSearchShow" />
</template>

<script setup lang="ts">
/**
 * 主布局：左侧边栏（全部文件/未分类/回收站、文件夹、来源、会员入口、帮助与设置），右侧 router-view 内容区；
 * 会员用量及用户信息来自全局 userStore。
 */
import { useI18n } from 'vue-i18n'
import { apiCloudFolderList } from '@/api'
import { useLoginStore } from '@/stores/login'
import { useUiStore } from '@/stores/ui'
import { useUserStore } from '@/stores/user'   // 新增：引入全局用户信息 store
import { loadSvg } from '@/utils'
import defaultAvatar from '@/assets/images/icon_default_avatar.svg'
import { folderColors } from '@/constants/folderColors.ts'
import tooltip from '@/components/tooltip.vue'
import ImportAudioModal from '@/components/importAudioModal/index.vue'
import CreateNewFolders from '@/components/createNewFolders.vue'
import SpriteSvg from '@/components/SpriteSvg.vue'
import FileSearchDialog from '@/components/fileSearchDialog.vue'
import { useMoveFolderStore } from '@/stores/moveFolder.ts'

const uiStore = useUiStore()
const loginStore = useLoginStore()
const moveFolderStore = useMoveFolderStore()
const userStore = useUserStore()  

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const isImportAudioModalVisible = ref(false)

const memberInfo = computed(() => userStore.userInfo)
const memberLoading = computed(() => userStore.loading)

// 图标悬停状态管理
const hoveredIcons = reactive({
  all: false,
  unclassified: false,
  recycle: false,
})

// 文件夹和来源的折叠/展开状态
const isFolderExpanded = ref(true)
const isSourcesExpanded = ref(true)

const folderList = ref([])

const newFoldersShow = ref(false) // 新建文件夹

getFolderList()

/**
 * 文件夹接口
 */
function getFolderList() {
  apiCloudFolderList({
    userId: loginStore.loginData.userId,
  })
    .then((res) => {
      folderList.value = res.data
    })
    .catch((error) => {
      console.error('加载文件夹列表失败:', error)
      folderList.value = []
    })
}

// ---------- 用户信息相关（基于 userStore） ----------
const userAvatar = computed(() => memberInfo.value?.headerUrl || defaultAvatar)

const displayName = computed(() => {
  if (memberLoading.value && !memberInfo.value) {
    return '--' // 加载中显示占位符
  }
  return memberInfo.value?.nickName?.trim() || 'BOYA User'
})

const handleAvatarError = (e: Event) => {
  ;(e.target as HTMLImageElement).src = defaultAvatar
}

// ---------- 会员相关（基于 userStore） ----------
function translatedOrFallback(key: string, fallback: string) {
  const value = t(key)
  return value === key ? fallback : value
}

const normalizedMemberType = computed(() => {
  const value = String(memberInfo.value?.memberType ?? '0').trim()
  return ['0', '1', '2', '3', '4', '5'].includes(value) ? value : '0'
})

const displayMemberName = computed(() => {
  if (memberLoading.value && !memberInfo.value) {
    return translatedOrFallback('layout.membership.memberType.notMember', 'Not a member')
  }

  switch (normalizedMemberType.value) {
    case '1':
      return translatedOrFallback('layout.membership.subscriptionPlans.explorer.name', 'Explorer')
    case '2':
    case '3':
      return translatedOrFallback('layout.membership.subscriptionPlans.professional.name', 'Pro')
    case '4':
    case '5':
      return translatedOrFallback('layout.membership.subscriptionPlans.master.name', 'Ultimate')
    default:
      return translatedOrFallback('layout.membership.memberType.notMember', 'Not a member')
  }
})

const usedMinutes = computed(() => {
  const value = Number(memberInfo.value?.useRecordRead)
  return Number.isFinite(value) ? Math.floor(value) : 0
})

const totalMinutes = computed(() => {
  const value = Number(memberInfo.value?.totalRecordRead ?? memberInfo.value?.resetRecordNum)
  return Number.isFinite(value) ? Math.floor(value) : 0
})

const showUsage = computed(() => normalizedMemberType.value !== '0')
const isUnlimited = computed(() => ['4', '5'].includes(normalizedMemberType.value))
const memberProgressPercent = computed(() => {
  if (!showUsage.value) return 0
  if (isUnlimited.value) return 0
  if (totalMinutes.value <= 0) return 0
  const percent = Math.floor((usedMinutes.value / totalMinutes.value) * 100)
  return Math.min(100, Math.max(0, percent))
})

function goMembershipCenter() {
  if (route.path !== '/member') {
    void router.push('/member')
  }
}

function openImportAudioModal() {
  isImportAudioModalVisible.value = true
}

// ---------- 用户信息加载 ----------
// 监听 userId 变化，重新获取用户信息
watch(
  () => loginStore.loginData.userId,
  () => {
    userStore.fetchUserInfo()
  },
  { immediate: true }
)

onMounted(() => {
  userStore.fetchUserInfo()
})

//=============  文件夹弹窗 ===============
const isFolderEdit = ref(false)
const folderData = ref({})

/**
 * 新建文件夹
 */
function newFolders() {
  moveFolderStore.setMoveFolderStore('')
  newFoldersShow.value = true
  folderData.value = {
    name: '',
    icon: 'folderIcon1',
    color: 'black',
  }
}

/**
 * 编辑文件夹
 * @param item
 */
function edit(item: any) {
  newFoldersShow.value = true
  folderData.value = item
  isFolderEdit.value = true
}

/**
 * 文件夹颜色
 * @param color
 */
function getColor(color: string) {
  let res = folderColors.find((val) => val.name === color)
  return res.value
}

//===================  搜索弹窗
const fileSearchShow = ref(false)
</script>

<style lang="scss" scoped>
/* 样式与原始代码完全一致，此处省略重复内容，仅保留占位 */
.common-layout {
  height: 100vh;
  overflow: hidden;
}

.aside {
  background-color: rgba(243, 243, 243, 1);
  transition: width 0.3s ease;
  overflow: hidden;
  border-right: 1px solid #e8e8e8;

  .aside-content-wrapper {
    width: 247px;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 20px 10px 10px;
    box-sizing: border-box;
  }

  .aside-top {
    .logo {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 0 16px 10px;

      .logo-left {
        display: flex;
        align-items: center;
        gap: 10px;

        img:first-child {
          width: 20px;
        }
      }

      .switch-icon {
        cursor: pointer;
        width: 16px;
        height: 16px;
      }
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      margin-bottom: 5px;
      cursor: pointer;

      &:hover {
        background-color: #ecebeb;
        border-radius: 4px;
      }

      span {
        font-size: 14px;
      }

      img {
        width: 20px;
        height: 20px;
      }
    }

    .custom-btn {
      width: 100%;
      justify-content: flex-start;
      gap: 10px;
      margin: 0 0 5px 0;
      padding: 20px 10px;
      border: none;
      background-color: transparent;
      font-size: 14px;
      color: #333;

      img {
        margin-right: 10px;
      }

      &:hover {
        background-color: #ecebeb;
        border-radius: 4px;
      }
    }
  }

  .menu {
    background-color: transparent;
    border-right: none;

    .el-menu-item {
      margin-bottom: 5px;
      border-radius: 6px;
      gap: 10px;
      padding-left: 10px !important;
      padding-right: 0 !important;
      height: 40px;
      line-height: 40px;

      &.is-active {
        background-color: #d7e9ff;
        color: #0075ff;
      }

      &:hover {
        background-color: #e8e8ea;
      }
    }
  }

  .aside-bottom {
    margin-top: auto;
  }
}

.main-content {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding: 0;

  &::-webkit-scrollbar {
    display: none;
  }
}

.header {
  display: flex;
  align-items: center;
  gap: 15px;

  .el-icon {
    cursor: pointer;
  }
}

.member {
  background: #ffffff;
  border-radius: 6px;
  padding: 15px 10px;
  margin-bottom: 8px;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    box-shadow 0.15s ease;

  &:active {
    background-color: #e8e8e8;
  }

  .name {
    font-size: 16px;
    line-height: 24px;
    color: #1f2937;
    font-weight: 700;
    margin-bottom: 8px;
  }

  .percent {
    height: 6px;
    background-color: #d7dde4;
    border-radius: 999px;
    overflow: hidden;
    margin-bottom: 6px;

    .percent-fill {
      height: 100%;
      background-color: #24a6ef;
      border-radius: inherit;
      transition: width 0.25s ease;
    }
  }

  .mes {
    font-size: 12px;
    line-height: 16px;
    color: #111827;
    font-weight: 400;
  }
}

.menu-bottom {
  .el-menu-item {
    height: 38px;
    margin: 4px 0;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 400;
    color: #1f2937;

    img {
      width: 20px !important;
      height: 20px !important;
      margin-right: 4px;
    }

    &.is-active {
      background-color: #c8dbf2 !important;
      color: #1f2937;
    }
  }
}

.folder-section {
  flex-shrink: 0;
  height: 40px;
  font-size: 14px;
  padding-left: 10px;

  .arrow {
    margin-left: 5px;
    cursor: pointer;
    transition: transform 0.3s ease;

    &.arrow-rotated {
      transform: rotate(180deg);
    }
  }
}

.folder-list {
  margin-top: 5px;
  margin-bottom: 15px;
  max-height: 320px;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;

  // 隐藏滚动条
  &::-webkit-scrollbar {
    display: none;
  }

  .more {
    width: 30px;
    height: 30px;
    justify-content: center;
  }

  .item {
    height: 40px;
    font-size: 14px;
    padding-left: 10px;
    cursor: pointer;

    &:hover {
      background: #ecebeb;
    }
  }
}
</style>