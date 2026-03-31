<!-- 封装 el-tooltip：透传 content，默认 placement 为 bottom，插槽为触发内容 -->
<template>
  <el-tooltip
      class="box-item"
      effect="dark"
      :content="content"
      placement="bottom"
  >
    <slot></slot>
  </el-tooltip>
</template>
<script lang="ts" setup>
/** 封装 el-tooltip：透传 content，默认 placement 为 bottom */
defineProps(['content'])
</script>
