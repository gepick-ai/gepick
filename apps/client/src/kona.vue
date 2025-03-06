<script setup lang="ts">
import { StyleProvider } from "ant-design-vue";
</script>

<template>
  <!-- issue: https://github.com/vueComponent/ant-design-vue/issues/6792 -->
  <!-- fix: antd vue where选择器问题导致部份浏览器where样式不生效：https://antdv.com/docs/vue/compatible-style-cn#where-%E9%80%89%E6%8B%A9%E5%99%A8 -->
  <StyleProvider hash-priority="high">
    <router-view></router-view>
  </StyleProvider>
</template>
