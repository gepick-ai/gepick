<script setup lang="ts">
import { onUpdated, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Tabs from "@gepick/client/components/tabs/index.vue"

interface Props {
  tabs?: { key: string, title: string }[]
  hideWrapper: boolean
}

const props = defineProps<Props>()
const activeKey = ref(props.tabs?.[0].key ?? "1")
const route = useRoute()

function selectPath() {
  switch (route.path) {
    case '/divination/chat':
      activeKey.value = 'Chat'
      break
  }
}

onUpdated(() => {
  selectPath()
})
</script>

<template>
  <div class="divination">
    <Tabs v-model:active-key="activeKey" :tabs="tabs" tab-position="left" :hide-wrapper="hideWrapper">
    </Tabs>
    <router-view></router-view>
  </div>
</template>

<style lang="scss" scoped>
.divination {
  width: 100%;
  min-height: 100%;
  color: #fff;
  user-select: none;
  background: url(@gepick/client/assets/images/bg@1x.png) 100% no-repeat;
  background-size: 100% 100%;
  padding-top: 160px;
  display: flex;
  justify-content: center;

  :deep(.ant-tabs) {
    // width: 100%;

    .ant-tabs-nav {
      .ant-tabs-nav-wrap {
        color: #fff !important;
        font-size: 14px;

        .ant-tabs-nav-list {
          .ant-tabs-tab {
            padding: 0;

            &:hover {
              color: #fff;
            }

            &.ant-tabs-tab-active {
              font-weight: 600;

              .ant-tabs-tab-btn {
                color: #fff;
              }
            }
          }

          .ant-tabs-ink-bar {
            display: none;
          }
        }
      }
    }

    .ant-tabs-content-holder {
      overflow-y: auto;
      overflow-x: hidden;
      margin-left: 60px;
      width: 932px;
      border: none;

      .ant-tabs-content {
        width: 932px;
        height: 100%;

        .ant-tabs-tabpane {
          padding-left: 0;
          width: initial;
        }
      }
    }
  }

  /* 自定义滚动条样式 */
  ::-webkit-scrollbar {
    width: 8px;
    /* 滚动条宽度 */
  }

  ::-webkit-scrollbar-track {
    background: transparent;
    /* 滚动条轨道背景色 */

    border-radius: 9px;
    /* 滚动条轨道圆角 */

  }

  ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.4);
    /* 滚动条滑块背景色 */
    border-radius: 10px;
    /* 滚动条滑块圆角 */
  }

  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.4);
    /* 滚动条滑块悬停背景色 */
  }
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
:deep(.ant-tabs-content-holder) {
  width: 0!important;
}
</style>
