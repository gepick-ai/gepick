<script setup lang="ts">
import { Button, Layout, LayoutContent, LayoutHeader } from "ant-design-vue"
import Tabs from "@gepick/client/components/tabs/index.vue"
import Auth from "@gepick/client/components/auth/index.vue"

import { PluginBrowserModule, commandRegistry } from '@gepick/plugin-system/browser';
import { ServiceContainer } from "@gepick/core/common";
import { PluginContribution } from "./plugin-contribution";

defineProps<Props>();

const container = new ServiceContainer([PluginBrowserModule])

interface Props {
  tabs?: { key: string, title: string }[]
}

function handleLog() {
  const pc = Reflect.construct(PluginContribution, [container])
  pc.onStart()
}

function handleCmd() {
  commandRegistry.executeCommand('hello-plugin-a')
}
</script>

<template>
  <Layout class="layout">
    <LayoutHeader>
      <div class="header-content">
        <div class="header-brand">
          Gepick
        </div>
        <div class="header-tabs">
          <Tabs :tabs="tabs">
          </Tabs>
        </div>
        <div class="header-login">
          <Auth></Auth>
          <Button type="primary" @click="handleLog">
            启动插件系统
          </Button>
          <Button type="primary" @click="handleCmd">
            调用cmd插件
          </Button>
        </div>
      </div>
    </LayoutHeader>
    <Layout>
      <LayoutContent class="layout-content">
        <router-view></router-view>
      </LayoutContent>
    </Layout>
  </Layout>
</template>

<style scoped lang="scss">
.layout {
  height: 100%;
  width: 100%;
}

:deep(.ant-layout-header) {
  user-select: none;
  background-color: transparent !important;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  width: 100%;
  padding-inline: 0 !important;

  .ant-tabs {
    height: 100%;
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    justify-content: center;

    .ant-tabs-nav {
      height: 100%;
    }

    .ant-tabs-nav-operations {
      display: none;
    }
  }
}

.header-content {
  width: 100%;
  height: 100%;
  max-width: 1200px;
  display: flex;
  justify-content: space-between;

  .header-brand {
    font-weight: 600;
    font-size: 48px;
    color: #FFFFFF;
  }

  .header-tabs {
    position: relative;
  }

}
</style>
