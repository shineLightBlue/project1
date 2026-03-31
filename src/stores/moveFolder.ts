import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useMoveFolderStore = defineStore(
  'moveFolder',
  () => {
    const moveFolderData = ref()

    function setMoveFolderStore(data) {
      moveFolderData.value = data
    }

    return { moveFolderData, setMoveFolderStore }
  },
  {
    persist: true,
  },
)
