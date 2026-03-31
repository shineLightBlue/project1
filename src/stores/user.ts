// src/stores/user.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiGetAppUserInfo } from '@/api'
import { useLoginStore } from './login'

export const useUserStore = defineStore('user', () => {
  const loginStore = useLoginStore()
  const userInfo = ref<any>(null)
  const loading = ref(false)

  // 获取用户信息（包含会员字段）
  const fetchUserInfo = async () => {
    const userId = loginStore.loginData.userId
    if (!userId) {
      userInfo.value = null
      return
    }
    loading.value = true
    try {
      const res = await apiGetAppUserInfo({ userId })
      if (res.code === 200) {
        userInfo.value = res.data
      } else {
        userInfo.value = null
      }
    } catch (error) {
      console.error('获取用户信息失败', error)
      userInfo.value = null
    } finally {
      loading.value = false
    }
  }

  return {
    userInfo,
    loading,
    fetchUserInfo,
  }
})