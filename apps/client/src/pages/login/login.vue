<script setup lang="ts">
import { useRouter } from 'vue-router';
import { EmailLoginButton, OauthLoginButton } from "@gepick/auth/browser"

const router = useRouter();

function handleRouteBack() {
  router.back();
}

function handleEmailLogin() {
  router.push({ name: "EmailLogin" });
}
</script>

<template>
  <div class="login">
    <div class="login-header">
      <div class="login-back" @click="handleRouteBack">
        <div class="back-icon">
          <svg
            viewBox="0 0 1024 1024" width="100%" height="100%" fill="none"
            style="user-select: none; flex-shrink: 0;"
          >
            <path
              d="M669.6 849.6c8.8 8 22.4 7.2 30.4-1.6s7.2-22.4-1.6-30.4l-309.6-280c-8-7.2-8-17.6 0-24.8l309.6-270.4c8.8-8 9.6-21.6 2.4-30.4-8-8.8-21.6-9.6-30.4-2.4L360.8 480.8c-27.2 24-28 64-0.8 88.8l309.6 280z"
              fill=""
            />
          </svg>
        </div>
        <div class="back-title">
          戻る
        </div>
      </div>
    </div>
    <div class="login-body">
      <div class="login-text">
        欢迎您，亲爱的访问者
      </div>
      <div class="login-content">
        <OauthLoginButton></OauthLoginButton>
        <div class="sep-text">
          OR
        </div>
        <EmailLoginButton :on-click="handleEmailLogin"></EmailLoginButton>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.login {
  width: 100%;
  min-width: 1200px;
  min-height: 100%;
  color: #fff;
  user-select: none;
  background: url(@gepick/client/assets/images/bg@1x.png) 100% no-repeat;
  background-size: 100% 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 80px;
  gap: 60px;
  overflow: auto;

  .login-header {
    width: 620px;
    height: 64px;
    display: flex;
    align-items: center;

    .login-back {
      cursor: pointer;
      display: flex;
      align-items: center;

      &:hover {
        opacity: 0.85;
      }

      .back-icon {
        width: 22px;

        svg {
          fill: #fff;
        }
      }

      .back-title {}
    }
  }

  .login-body {
    width: 460px;
    display: flex;
    flex-direction: column;
    align-items: center;

    .login-text {
      font-size: 32px;
      margin: 40px 0;
    }

    .login-content {
      width: 380px;
      display: flex;
      flex-direction: column;
      gap: 24px;

      .sep-text {
        text-align: center;
      }

      .login-footer {
        font-size: 14px;
        display: flex;
        justify-content: center;
      }
    }
  }

}
</style>
