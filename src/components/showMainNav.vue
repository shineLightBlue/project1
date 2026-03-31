<template>
  <img
    v-if="!uiStore.isL1AsideVisible"
    :src="loadSvg(isHover ? 'icon_switch' : 'icon_logo')"
    alt="Show L1 Navigation"
    class="show-l1-icon"
    @click="uiStore.toggleL1Aside(true)"
    @mouseover="isHover = true"
    @mouseout="isHover = false"
  />
</template>
<script setup>
import { loadSvg } from '@/utils/index.js'
import { useUiStore } from '@/stores/ui'

const uiStore = useUiStore()
const isHover = ref(false)
watch(
  () => uiStore.isL1AsideVisible,
  () => {
    if (!uiStore.isL1AsideVisible) {
      isHover.value = false
    }
  },
)
</script>
<style scoped>
.show-l1-icon {
  width: 18px;
  height: 18px;
  cursor: pointer;
  transform: rotate(180deg);
}
</style>
