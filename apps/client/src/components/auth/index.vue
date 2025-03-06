<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from "vue-router"
import { Dropdown, Menu, MenuItem, MenuProps } from "ant-design-vue"
import { getUser } from "@gepick/user/browser"
import { userStore } from '@gepick/client/store';

const userInfo = userStore()
const router = useRouter()

const handleMenuClick: MenuProps['onClick'] = (e) => {
  if (e.key === 'logout') {
    localStorage.removeItem("token")
    location.reload()
  }
}

function handleLoginOrRegister() {
  router.push({ name: 'Login' })
}

onMounted(async () => {
  const token = window.localStorage.getItem('token')

  if (token) {
    const { user } = await getUser()

    userInfo.setUserInfo(user)
  }
})
</script>

<template>
  <div class="auth">
    <template v-if="!userInfo.name">
      <div class="login-register" @click="handleLoginOrRegister">
        登录
      </div>
    </template>
    <template v-else>
      <div class="user-info">
        <div class="quota-group">
          <div class="chat-quota quota">
            <img src="@gepick/client/assets/images/chat-quota.jpg">
            <div class="quota-detail">
              <span>{{ userInfo.chatUsed }}</span>
              <span>/</span>
              <span>{{ userInfo.chatLimit }}</span>
            </div>
          </div>
          <div class="wallpaper-quota quota">
            <img src="@gepick/client/assets/images/wallpaper-quota.jpg">
            <div class="quota-detail">
              <span>{{ userInfo.wallpaperUsed }}</span>
              <span>/</span>
              <span>{{ userInfo.wallpaperLimit }}</span>
            </div>
          </div>
          <div class="omikuji-quota quota">
            <img src="@gepick/client/assets/images/omikuji-quota.jpg">
            <div class="quota-detail">
              <span>{{ userInfo.omikujiUsed }}</span>
              <span>/</span>
              <span>{{ userInfo.omikujiLimit }}</span>
            </div>
          </div>
        </div>
        <Dropdown>
          <template #overlay>
            <Menu @click="handleMenuClick">
              <MenuItem key="logout">
                退出登录
              </MenuItem>
            </Menu>
          </template>
          <div class="user-detail">
            <div v-if="userInfo.avatarUrl" class="user-avatar">
              <img :src="userInfo.avatarUrl" />
            </div>
            <div v-else class="default-avatar">
              <span>{{ userInfo.name[0].toUpperCase() }}</span>
            </div>
            <span class="user-name">{{ userInfo.name }}</span>
          </div>
        </Dropdown>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.auth {
  .login-register {
    color: #fff;
    font-size: 14px;
    cursor: pointer;
  }

  .user-info {
    display: flex;
    align-items: center;
    margin-top: 10px;

    .quota-group {
      color: #fff;
      display: flex;
      align-items: center;
      border-radius: 20px;
      border: 1px solid #fff;
      padding: 0 12px;
      font-size: 14px;
      height: 40px;
      margin-right: 20px;
      gap: 20px;

      img {
        width: 16px;
        height: 16px;
      }

      .quota {
        display: flex;
        align-items: center;
        gap: 4px;

        .quota-detail {
          display: flex;
          align-items: center;
        }
      }
    }

   .user-detail {
    display: flex;
    align-items: center;
    gap: 10px;
    .user-avatar {
        img {
          width: 36px;
          height: 36px;
          border-radius: 50%;
        }
      }

      .default-avatar{
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background-color:azure;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 24px;
        font-weight: 700;
        color:rgb(62, 112, 203);
      }

      .user-name {
        font-size: 14px;
        color: #fff;
      }
   }
  }
}
</style>
