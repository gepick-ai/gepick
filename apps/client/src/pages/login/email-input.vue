<!-- eslint-disable regexp/no-unused-capturing-group -->
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Input, message } from 'ant-design-vue';
import { sendEmailCaptcha, signInEmail } from '@gepick/auth/browser';

enum EmailInputStatus {
  Input,
  Verify,
}

const router = useRouter();
const status = ref<EmailInputStatus>(EmailInputStatus.Input);
const headerText = computed(() => {
  // return status.value === EmailInputStatus.Input ? '请输入您的邮箱地址' : '请输入您邮箱中的验证码';
  return status.value === EmailInputStatus.Input ? 'メールアドレスを入力してください' : 'メールボックスに届いた確認コードを入力してください';
});
const btnText = computed(() => {
  // return status.value === EmailInputStatus.Input ? '下一步' : '登录';
  return status.value === EmailInputStatus.Input ? '次へ' : 'ログイン';
});
const mailValue = ref<string>("");
const captchaValue = ref<string>("")

function validateEmail(email: string) {
  const emailRegex
    = /^(?:[^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*|(".+"))@(?:\[\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\]|((?:[a-z\-0-9]+\.)+[a-z]{2,}))$/i;

  return emailRegex.test(email);
}

function handleBack() {
  if (status.value === EmailInputStatus.Verify) {
    status.value = EmailInputStatus.Input;
    captchaValue.value = "";
  }
  else {
    router.back();
  }
}

async function handleBtnClick() {
  if (status.value === EmailInputStatus.Input) {
    if (!mailValue.value || !validateEmail(mailValue.value)) {
      message.error('正しいメールアドレスを教えてね！ ');
      return;
    }

    status.value = EmailInputStatus.Verify;
    try {
      await sendEmailCaptcha({
        email: mailValue.value,
      });
    }
    catch (err) {
      message.error((err as Error).message);
    }
  }
  else {
    if (!captchaValue.value || captchaValue.value.length !== 6) {
      // message.error('请输入正确的验证码');
      message.error('正しい確認コードを入力してください');
      return;
    }
    signInEmail({
      email: mailValue.value,
      captcha: captchaValue.value,
    }).then(({ redirectUri, token }) => {
      router.push(redirectUri ?? '/');

      window.localStorage.setItem('token', token);
    }).catch((e) => {
      // eslint-disable-next-line no-console
      console.log(e.message)
    })
  }
}
</script>

<template>
  <div class="email-input">
    <div class="email-input-header">
      <div class="email-input-back" @click="handleBack">
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
    <div class="email-input-body">
      <div class="email-input-text">
        {{ headerText }}
      </div>
      <div class="email-input-content">
        <Input v-if="status === EmailInputStatus.Input" v-model:value="mailValue"></Input>
        <Input v-else v-model:value="captchaValue"></Input>
        <div class="email-input-next" @click="handleBtnClick">
          {{ btnText }}
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.email-input {
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

  .email-input-header {
    width: 620px;
    height: 64px;
    display: flex;
    align-items: center;

    .email-input-back {
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

  .email-input-body {
    width: 460px;
    display: flex;
    flex-direction: column;
    align-items: center;

    .email-input-text {
      font-size: 32px;
      margin: 40px 0;
    }

    .email-input-content {
      width: 380px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .email-input-next {
      height: 42px;
      text-align: center;
      line-height: 32px;
      font-size: 14px !important;
      color: #fff;
      border: 1px solid #fff;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 0 20px;

      &:hover {
        opacity: 0.85;
      }
    }
  }
}

:deep(.ant-input) {
  height: 42px;
  font-size: 16px;
}
</style>
