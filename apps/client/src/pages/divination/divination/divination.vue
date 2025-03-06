<script setup lang="ts">
import { useRoute } from "vue-router"
import { ChatBot } from '@gepick/copilot/browser';
import { userStore } from '@gepick/client/store';
import { computed, ref } from 'vue';

const userInfo = userStore()
const chatbotRef = ref()
const route = useRoute();
const prompt = computed(() => route.query.prompt as string);
</script>

<template>
  <div class="divination-chat">
    <ChatBot
      ref="chatbotRef" :on-completion-finished="userInfo.refreshUserInfo.bind(userInfo)"
      :user-info="{ avatarUrl: userInfo.avatarUrl, name: userInfo.name }" :prompt="prompt"
    >
    </ChatBot>
  </div>
</template>

<style lang="scss" scoped>
.divination-chat {
  width: 900px;
  height: calc(100vh - 160px);
}
</style>
