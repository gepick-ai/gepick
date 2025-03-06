<script setup lang="ts">
import NicePathBox from "@gepick/client/components/nice-patch-box/nice-patch-box.vue"
</script>

<template>
  <div class="gepick-button">
    <NicePathBox :border-width="5" image-url="@gepick/client/assets/images/border-image@2x.png">
      <slot></slot>
    </NicePathBox>
  </div>
</template>

<style scoped lang="scss"></style>
