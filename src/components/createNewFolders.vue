<template>
  <el-dialog
    align-center
    v-model="dialogVisible"
    :title="isEdit ? t('layout.sidebar.editFolder.title') : t('layout.sidebar.createFolder.title')"
    width="357px"
    @close="handleClose"
    destroy-on-close
    :close-on-click-modal="false"
    :close-icon="'CloseIcon'"
    class="create-folder-dialog"
  >
    <div class="modal-body">
      <!-- 名称输入 -->
      <div class="form-item">
        <label class="form-label">{{ t('layout.sidebar.createFolder.nameLabel') }}</label>
        <el-input
          v-model="formData.name"
          :placeholder="t('layout.sidebar.createFolder.namePlaceholder')"
          class="form-input"
          maxlength="34"
        />
      </div>

      <!-- 颜色选择 -->
      <div class="form-item">
        <label class="form-label">{{ t('layout.sidebar.createFolder.colorLabel') }}</label>
        <div class="color-selector">
          <div
            v-for="color in folderColors"
            :key="color.name"
            class="color-dot flex-vertical"
            :class="{ selected: formData.color === color.name }"
            :style="{ backgroundColor: color.value }"
            @click="formData.color = color.name"
          >
            <img
              v-if="formData.color === color.name"
              :src="loadSvg('icon_foldericon_choose')"
              alt=""
            />
          </div>
        </div>
      </div>

      <!-- 图标选择 -->
      <div class="form-item">
        <label class="form-label">{{ t('layout.sidebar.createFolder.iconLabel') }}</label>
        <el-popover
          placement="right-start"
          :width="300"
          trigger="click"
          popper-class="folders-icon"
          :show-arrow="false"
          ref="popoverRef"
        >
          <template #reference>
            <div class="icon-selector">
              <svg class="svg-icon">
                <use :href="'#' + formData.icon"></use>
              </svg>
              <img :src="loadSvg('icon_foldericon_right_arrow')" alt="arrow" class="arrow-icon" />
            </div>
          </template>
          <template #default>
            <div class="flex-center icon-nav">
              <div class="title">{{ t('layout.sidebar.createFolder.iconSelectorTitle') }}</div>
              <img
                class="close"
                src="@/assets/images/icon_close.svg"
                alt=""
                @click="closePopover"
              />
            </div>
            <!-- 引入 SVG 雪碧图组件 -->
            <SpriteSvg />
            <div class="icon-grid">
              <div
                class="icon-item pointer"
                @click="selectIcon(item)"
                v-for="item in 42"
                :key="item"
              >
                <svg class="svg-icon" :class="{ selected: formData.icon === 'folderIcon' + item }">
                  <use :href="'#folderIcon' + item"></use>
                </svg>
              </div>
            </div>
          </template>
        </el-popover>
      </div>
    </div>

    <!-- 按钮 -->
    <el-button class="create-btn" :class="{ active: formData.name }" @click="handleCreate">
      {{
        isEdit
          ? t('layout.sidebar.editFolder.saveButton')
          : t('layout.sidebar.createFolder.createButton')
      }}
    </el-button>

    <!-- 删除 -->
    <el-button v-show="isEdit" class="create-btn delete" @click="handleDelete">
      {{ t('layout.sidebar.editFolder.deleteButton') }}
    </el-button>
  </el-dialog>

  <!-- 删除确认弹窗 -->
  <DeleteDialog
    v-model="deleteDialogVisible"
    :title="t('layout.sidebar.editFolder.deleteConfirm.title')"
    @confirmDelete="confirmDelete"
  >
    <p>{{ t('layout.sidebar.editFolder.deleteConfirm.message') }}</p>
    <p>{{ t('layout.sidebar.editFolder.deleteConfirm.question') }}</p>
  </DeleteDialog>
</template>

<script setup lang="ts">
import { ElDialog, ElInput, ElMessage, ElButton } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { loadSvg } from '@/utils'
import { apiFolderCreate, apiFolderDelete, apiFolderUpdate } from '@/api'
import { useLoginStore } from '@/stores/login.ts'
import SpriteSvg from '@/components/SpriteSvg.vue'
import { folderColors } from '@/constants/folderColors.ts'
import eventBus from '@/utils/eventBus.ts'
import { useMoveFolderStore } from '@/stores/moveFolder.ts'
import DeleteDialog from '@/components/deleteDialog.vue'

const dialogVisible = defineModel()
const popoverRef = ref()
const deleteDialogVisible = ref(false)
const { t } = useI18n()

const loginStore = useLoginStore()
const moveFileStore = useMoveFolderStore()

const router = useRouter()

const props = defineProps<{
  isEdit: boolean
  editData: Record<string, any>
}>()

const emit = defineEmits<{
  close: []
  create: []
}>()

const formData = reactive({
  name: '',
  color: 'black',
  icon: 'folderIcon1',
})
watch(
  () => props.editData,
  () => {
    formData.name = props.editData.name
    formData.icon = props.editData.icon
    formData.color = props.editData.color
  },
  { immediate: true },
)

/**
 * 关闭
 */
function handleClose() {
  // 重置表单数据到初始值或编辑数据
  if (props.isEdit && props.editData) {
    formData.name = props.editData.name
    formData.icon = props.editData.icon
    formData.color = props.editData.color
  } else {
    formData.name = ''
    formData.icon = 'folderIcon1'
    formData.color = 'black'
  }
  dialogVisible.value = false
}

/**
 * 创建文件夹
 */
async function handleCreate() {
  if (!formData.name.trim()) {
    ElMessage.success(t('layout.sidebar.createFolder.nameRequired'))
    return
  }
  const api = props.isEdit ? apiFolderUpdate : apiFolderCreate
  // 编辑时，文件夹名变了，才需要newFolderName字段
  const params =
    props.isEdit && formData.name !== props.editData.name ? { newFolderName: formData.name } : {}
  await api({
    name: props.isEdit ? props.editData.name : formData.name.trim(),
    userId: loginStore.loginData.userId,
    color: formData.color,
    icon: formData.icon.replace('42', '44'), // 兼容旧版
    ...params,
  })
  ElMessage.success(
    props.isEdit
      ? t('layout.sidebar.editFolder.saveSuccess')
      : t('layout.sidebar.createFolder.success'),
  )

  // 重置表单并关闭弹窗
  handleClose()
  emit('close')
  if (moveFileStore.moveFolderData) {
    eventBus.emit('showMoveFilePopup')
  }
}

/**
 * 删除弹窗
 */
function handleDelete() {
  deleteDialogVisible.value = true
}

/**
 * 确认删除
 */
async function confirmDelete() {
  await apiFolderDelete({
    id: props.editData.id,
    name: formData.name,
    userId: loginStore.loginData.userId,
  })
  ElMessage.success(t('layout.sidebar.editFolder.deleteSuccess'))
  deleteDialogVisible.value = false
  handleClose()
  emit('close')
  router.push('/?type=all')
}

/**
 * 选中图标
 * @param i
 */
function selectIcon(i: number) {
  formData.icon = 'folderIcon' + i
  closePopover()
}

/**
 * 关闭popover
 */
function closePopover() {
  popoverRef.value?.hide()
}

function open() {
  dialogVisible.value = true
  formData.name = ''
  formData.icon = 'folderIcon1'
  formData.color = 'black'
}

onMounted(() => {
  eventBus.on('openNewFolder', open)
})
</script>

<style lang="scss" scoped>
.create-folder-dialog {
  .modal-body {
    .form-item {
      margin-bottom: 20px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .form-label {
      display: block;
      color: #000;
      font-size: 12px;
      margin-bottom: 10px;
    }

    .form-input {
      width: 100%;

      :deep(.el-input__wrapper) {
        border-radius: 8px;
        padding: 0 20px;
        height: 35px;
        background: #f4f3f3;
        box-shadow: none;
      }
    }

    .color-selector {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      background: #f4f3f3;
      padding: 6.5px 20px;
      border-radius: 6px;
    }

    .color-dot {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      cursor: pointer;
      position: relative;
      transition: transform 0.2s;

      &:hover {
        transform: scale(1.05);
      }

      &.selected {
        .check-icon {
          display: block;
        }
      }

      .check-icon {
        display: none;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: white;
        font-size: 12px;
        font-weight: bold;
      }
    }

    .icon-selector {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      height: 35px;
      background: #f4f3f3;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.2s;

      &:hover {
        background: #e8e8e8;
      }

      .icon-img {
        width: 16px;
        height: 16px;
      }
    }
  }

  .create-btn {
    background: #0075ff33;
    color: white;
    border: none;
    border-radius: 6px;
    height: 50px;
    width: 100%;
    margin-top: 30px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition:
      background 0.2s,
      transform 0.1s;

    &.active {
      background: #0075ff;
    }

    &.delete {
      margin-left: 0;
      margin-top: 10px;
      color: #ff2020;
      border: 1px solid #979797;
      background: none;
    }
  }
}
</style>
<style lang="scss">
.el-popover.folders-icon {
  width: 385px !important;
  padding: 0 20px 20px;
  margin-left: 4px;
  border: 0;

  .icon-nav {
    justify-content: space-between;
    height: 61px;

    .title {
      font-size: 18px;
      font-weight: bold;
      color: #000;
    }

    .close {
      cursor: pointer;
    }
  }

  .icon-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 15px;
    width: 100%;
    overflow: hidden;

    .icon-item {
      &:hover {
        .svg-icon {
          color: #007aff;
        }
      }
    }
  }
}

.svg-icon {
  width: 30px;
  height: 30px;
  color: #000000;
  transition: color 0.2s;

  &.selected {
    color: #007aff;
  }
}

.el-dialog.create-folder-dialog {
  border-radius: 12px;
}
</style>
