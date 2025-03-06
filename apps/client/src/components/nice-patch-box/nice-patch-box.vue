<script setup lang="ts">
defineProps<{
  imageUrl: string
  borderWidth: number
}>();
</script>

<template>
  <div
    class="nine-patch-box" :style="{
      '--border-image-url': `url(${imageUrl})`,
      '--border-width': `${borderWidth}px`,
    }"
  >
    <slot></slot>
  </div>
</template>

<style scoped lang="scss">
.nine-patch-box {
  width: 100%;
  height: 100%;
  padding: 20px;
  border: var(--border-width) solid transparent;
  border-image: var(--border-image-url) var(--border-width) round;
  /* 使用 CSS 变量来动态设置边框图像和宽度 */
}
</style>
