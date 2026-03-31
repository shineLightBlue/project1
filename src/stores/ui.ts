import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUiStore = defineStore('ui', () => {
  const isL1AsideVisible = ref(true);
  const isL2AsideVisible = ref(true);

  function toggleL1Aside(visible?: boolean) {
    isL1AsideVisible.value = visible ?? !isL1AsideVisible.value;
  }

  function toggleL2Aside(visible?: boolean) {
    isL2AsideVisible.value = visible ?? !isL2AsideVisible.value;
  }

  return {
    isL1AsideVisible,
    isL2AsideVisible,
    toggleL1Aside,
    toggleL2Aside,
  };
});
