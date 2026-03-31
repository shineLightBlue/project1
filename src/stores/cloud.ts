import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCloudStore = defineStore('cloud', () => {
  const refreshVersion = ref(0)

  function bumpRefresh() {
    refreshVersion.value += 1
  }

  return {
    refreshVersion,
    bumpRefresh
  }
})
