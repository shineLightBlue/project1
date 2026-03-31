<template>
  <div class="profile-page">
    <div class="profile-content">
      <!-- 头像 -->
      <div class="avatar">
        <img :src="avatarUrl" />
        <div class="avatar-edit-icon" :title="t('layout.settings.editAvatar')">
          <img src="@/assets/images/icon_edit.svg" class="edit-svg" @click="triggerFileSelect" />
        </div>
      </div>
      <!-- 昵称 -->
      <div class="info">
        <div class="label">{{ t('layout.settings.nickname') }}</div>
        <div class="nickname-wrapper" :class="{ 'is-error': errorMessage }">
          <el-input
            v-model="nicknameInput"
            @blur="handleNicknameBlur"
            @keyup.enter="handleNicknameBlur"
            :placeholder="t('layout.settings.nicknamePlaceholder')"
            :disabled="loading || uploading"
          />
        </div>
        <!-- 错误提示 -->
        <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
      </div>
    </div>
    <!-- 文件输入框 -->
    <input
      type="file"
      ref="fileInput"
      accept="image/*"
      style="display: none"
      @change="handleFileChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { apiUpdateAppUserNickName, apiSetUserHeadImg } from '@/api/index.ts'
import { useLoginStore } from '@/stores/login'
import { useUserStore } from '@/stores/user'   // 新增全局用户信息 store
import defaultAvatar from '@/assets/images/icon_default_avatar.svg'

const { t } = useI18n()
const loginStore = useLoginStore()
const userStore = useUserStore()   // 使用全局用户信息 store

const loading = ref(false)
const uploading = ref(false)
const error = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

// 从 userStore 中获取用户信息（响应式）
const userInfo = computed(() => userStore.userInfo)

// 头像 URL
const avatarUrl = computed(() => userInfo.value?.headerUrl || defaultAvatar)

// 昵称输入框初始值
const nicknameInput = ref(userInfo.value?.nickName || '')
const errorMessage = ref('')

// 监听 userStore 中用户信息的变化，同步更新输入框的值
watch(userInfo, (newVal) => {
  nicknameInput.value = newVal?.nickName || ''
  errorMessage.value = ''   // 清空错误提示
}, { immediate: true })

// 校验昵称输入
const validateInput = (nickname: string) => {
  const trimmed = nickname.trim()
  if (trimmed === '') {
    errorMessage.value = t('layout.settings.nicknamePlaceholder') 
  } else if (trimmed.length > 50) {
    errorMessage.value = t('layout.settings.nicknameMaxBytesExceeded')
  } else {
    errorMessage.value = ''
  }
}

watch(nicknameInput, (newVal) => {
  validateInput(newVal)
})

// 更新昵称
const validateAndUpdate = async () => {
  const newNicknameRaw = nicknameInput.value
  const newNickname = newNicknameRaw.trim()
  const currentNickname = userInfo.value?.nickName || ''

  const isValid = newNickname !== '' && newNickname.length <= 50

  if (!isValid) {
    nicknameInput.value = currentNickname
    return
  }
  errorMessage.value = ''

  if (newNickname === currentNickname) return

  const userId = loginStore.loginData.userId
  if (!userId) return

  try {
    const res = await apiUpdateAppUserNickName({ userId, nickName: newNickname })
    if (res.code === 200) {
      ElMessage.success(t('auth.success.nicknameUpdated'))
      // 刷新全局用户信息
      await userStore.fetchUserInfo()
    } else {
      ElMessage.error(t('auth.error.updateNicknameFailed'))
      nicknameInput.value = currentNickname   // 恢复原值
    }
  } catch (err: any) {
    ElMessage.error(t('auth.error.updateNicknameFailed'))
    nicknameInput.value = currentNickname
  }
}

const handleNicknameBlur = () => {
  validateAndUpdate()
}

// 上传头像
const triggerFileSelect = () => {
  if (uploading.value) return
  fileInput.value?.click()
}

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    ElMessage.warning(t('auth.errors.invalidImageFile'))
    return
  }
  if (file.size > 1 * 1024 * 1024) {
    ElMessage.warning(t('auth.errors.imageFileTooLarge'))
    return
  }

  uploading.value = true
  const formData = new FormData()
  formData.append('file', file)

  try {
    const res = await apiSetUserHeadImg(formData)
    if (res.code === 200) {
      ElMessage.success(t('auth.success.avatarUpdated'))
      // 刷新全局用户信息
      await userStore.fetchUserInfo()
    } else {
      ElMessage.error(t('auth.errors.uploadAvatarFailed'))
    }
  } catch (err: any) {
    ElMessage.error(t('auth.errors.uploadAvatarFailed'))
  } finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

// 页面加载时确保用户信息已获取
onMounted(() => {
  if (!userInfo.value) {
    userStore.fetchUserInfo()
  }
})
</script>

<style scoped>
/* 样式与原始代码完全一致，此处保留不变 */
.profile-page {
  font-family: 'PingFang SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  height: 100%;
  background-color: #ffffff;
  padding: 5px 24px;
  margin-left: 0px;
}

.loading,
.error {
  text-align: center;
  margin-top: 40px;
  color: #666;
}

.error {
  color: #f56c6c;
}

.profile-content {
  gap: 32px;
  align-items: center;
}

.avatar {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  cursor: pointer;
}

.avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.avatar-edit-icon {
  position: absolute;
  bottom: 0px;
  right: 0px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s, color 0.2s;
  z-index: 1;
}

.avatar-edit-icon .edit-svg {
  width: 22px;
  height: 22px;
  display: block;
  color: #666;
}

.avatar:hover .avatar-edit-icon {
  border: 0.1px solid rgba(0, 0, 0, 0.3);
}

.info {
  flex: 1;
}

.label {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  margin: 15px 0;
}

.nickname-wrapper {
  width: 700px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 6px;
  transition: background-color 0.2s;
}

.nickname-wrapper:hover {
  background-color: #f5f5f5;
}

/* 错误状态边框 */
.nickname-wrapper.is-error {
  border-color: #f56c6c;
}

.nickname-wrapper :deep(.el-input__wrapper) {
  background-color: transparent;
  box-shadow: none;
  padding: 0 15px;
}

.nickname-wrapper :deep(.el-input__inner) {
  font-size: 14px;
  color: #1f2937;
  height: 40px;
  line-height: 40px;
}

.error-message {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 4px;
  line-height: 1.5;
  width: 700px;
}
</style>