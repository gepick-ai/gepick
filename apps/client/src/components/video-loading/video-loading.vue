<script lang="ts" setup>
interface Props {
  src: string;
}

defineProps<Props>()
</script>

<template>
  <div class="video-loading">
    <video autoplay loop muted playsinline>
      <source :src="src" type="video/mp4">
    </video>
  </div>
</template>

<style scoped lang="scss">
.video-loading {
  position: fixed;
  top: 0;
  left:0;
  right:0;
  bottom:0;
  background-color: rgba(0,0,0,0.9);
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
