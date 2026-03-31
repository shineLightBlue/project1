<template>
  <teleport to="body">
    <transition name="toast-fade">
      <div v-if="showToast" class="toast-notification" :class="{ move: data?.type === 'move' }">
        <div class="notification-content" @click.stop>
          <div class="notification-left flex-center">
            <img
              src="@/assets/images/icon_merge_success.svg"
              alt=""
              v-if="data?.type === 'merge'"
              class="merge-icon"
            />
            <!-- 合并成功 -->
            <span class="success-text" v-if="data?.type === 'merge'">{{
              t('layout.secondaryNav.merge.mergeSuccess')
            }}</span>
            <!-- 移动文件夹 -->
            <span class="success-text" v-if="data?.type === 'move'">
              {{
                t('layout.secondaryNav.move.moveSuccess', {
                  fileName: data.fileName,
                  folderName: data.folderName,
                })
              }}
            </span>
          </div>
          <div class="notification-divider"></div>
          <!-- 查看 -->
          <div class="notification-right">
            <button class="view-btn" @click="handleViewClick">
              {{ t('layout.secondaryNav.merge.view') }}
            </button>
          </div>
          <div class="close-icon" v-if="false">×</div>
        </div>
      </div>
    </transition>
  </teleport>
</template>
<script setup>
import { useI18n } from 'vue-i18n'

const emit = defineEmits(['mergeView'])

const showToast = defineModel()
const router = useRouter()

const { t } = useI18n()

const props = defineProps(['data'])

/**
 * 查看
 */
function handleViewClick() {
  const type = props.data.type
  if (type === 'move') {
    router.push('/?type=folders&parentId=' + props.data.parentId)
  }
  if (type === 'merge') {
    console.log('merge')
    emit('mergeView')
  }
}
</script>
<style lang="scss" scoped>
.toast-notification {
  position: fixed;
  top: 20px;
  left: 0;
  right: 0;
  margin: 0 auto;
  z-index: 9999;
  width: max-content;

  &.move {
    .notification-content {
      border: none;
      background-color: #e5f1ff;
    }

    .view-btn {
      border-color: #0075ff !important;
      color: #0075ff !important;
    }
  }
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.3s ease;
}

.toast-fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.notification-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  background: #f0f9eb;
  border: 1px solid #67bd6a;
  border-radius: 6px;
  padding: 15px 25px;
  min-width: 311px;
  position: relative;
  box-sizing: border-box;

  .notification-left {
    .merge-icon {
      margin-right: 5px;
    }

    .success-text {
      font-weight: 600;
      color: #000;
    }
  }

  .notification-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;

    .view-btn {
      background: transparent;
      border: 1px solid #67bd6a;
      color: #606266;
      font-size: 14px;
      font-weight: 500;
      padding: 0 11px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: rgba(64, 158, 255, 0.1);
      }
    }
  }

  .close-icon {
    color: #909399;
    font-size: 16px;
    cursor: pointer;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 2px;
    transition: all 0.2s;

    &:hover {
      color: #606266;
      background: rgba(0, 0, 0, 0.05);
    }
  }
}
</style>
