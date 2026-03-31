import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useLoadingStore = defineStore('loading', () => {
  const isLoading = ref(false)

  function setLoading(data: boolean) {
    isLoading.value = data
  }

  return { isLoading, setLoading }
})
