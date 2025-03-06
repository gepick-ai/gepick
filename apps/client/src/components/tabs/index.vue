<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { TabPane, Tabs, message } from "ant-design-vue"
import { useRoute, useRouter } from 'vue-router';
import { Key } from 'ant-design-vue/es/_util/type';

interface Props {
  tabs?: { key: string, title: string }[]
  hideWrapper?: boolean
}

withDefaults(defineProps<Props>(), {
  tabs: () => [
    { key: '1', title: 'Tab 1' },
    { key: '2', title: 'Tab 2' },
    { key: '3', title: 'Tab 3' },
  ],
  hideWrapper: false,
});
const activeKey = defineModel("active-key", {
  type: String,
  default: "1",
})
const route = useRoute()
const router = useRouter();

function handleTabChange(key: Key) {
  const selectedKey = key as string;
  const routeNames = router.getRoutes().map(route => route.name)

  if (routeNames.includes(selectedKey)) {
    router.push({ name: selectedKey });
  }
  else {
    // ======NOTE: 抛出警告提示，开发DEBUG使用======
    message.warning(`请检查Router路由配置，确认路由名为"${selectedKey}"的路由已经被正确注册到Vue Router当中！`)

    router.push({ name: 'Root' });
  }
}

onMounted(() => {
  if (route.name) {
    if (["Chat", "Omikuji", "Wallpaper"].includes(route.name as string)) {
      activeKey.value = 'Divination'
      router.push(`/divination/${(route.name as string).toLowerCase()}`)
    }
    else {
      activeKey.value = route.name as string;
    }
  }
})
</script>

<template>
  <Tabs v-model:active-key="activeKey" :class="hideWrapper && 'hide-wrapper'" @change="handleTabChange">
    <TabPane v-for="item in tabs" :key="item.key" :tab="item.title"></TabPane>
  </Tabs>
</template>

<style scoped lang="scss">
:deep(.ant-tabs-nav) {
  &::before {
    display: none;
  }

  .ant-tabs-nav-wrap {
    overflow: visible !important;
    color: #fff;

    .ant-tabs-nav-list {
      .ant-tabs-tab {
        position: relative;
        width: 54px !important;
        height: 122px !important;
        padding: 0;

        .ant-tabs-tab-btn {
          width: 100%;
          text-align: center;
        }

        &:hover {
          color: #fff;
        }

        &.ant-tabs-tab-active {
          .ant-tabs-tab-btn {
            position: relative;
            color: #fff;
            font-weight: bold;

            &::before {
              content: "";
              position: absolute;
              top: -20px;
              left: -5px;
              display: block;
              width: 54px;
              height: 122px;
              background: url(@gepick/client/assets/images/tab-tag@1x.png) 100% no-repeat;
              background-position: center center;
            }
          }

        }

      }

      .ant-tabs-ink-bar {
        background-color: transparent;
        height: 12px;
        width: 100% !important;
        top: 19px;
        left: 0 !important;
        background: url(@gepick/client/assets/images/tabs-line@1x.png) 100% no-repeat;
        background-position: left top;
      }
    }
  }
}

.hide-wrapper {
  :deep(.ant-tabs-nav) {
    .ant-tabs-nav-wrap {
      .ant-tabs-nav-list {
        .ant-tabs-tab {
          height: fit-content !important;

          &.ant-tabs-tab-active {
            .ant-tabs-tab-btn {
              position: relative;
              color: #fff;
              font-weight: bold;

              &::before {
                background: none;
              }
            }

          }

        }

        .ant-tabs-ink-bar {
          background: none;
        }
      }
    }

  }

}
</style>
