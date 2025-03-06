/* @jsxImportSource vue */

import { defineComponent, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router';
import { signInOauth } from "@gepick/auth/browser"
import { OAuthProvider } from "@gepick/auth/common"

interface GoogleRedirectParams {
  authuser: string
  code: string
  prompt: string
  scope: string
  state: string
}

export const OauthCallback = defineComponent({
  name: "OauthCallback",

  setup() {
    onMounted(async () => {
      const route = useRoute();
      const router = useRouter();
      const searchParams = route.query as unknown as GoogleRedirectParams;

      signInOauth({
        code: searchParams.code,
        state: searchParams.state,
        provider: OAuthProvider.Google,
      }).then(({ redirectUri, token }) => {
        router.push(redirectUri ?? '/');

        window.localStorage.setItem('token', token);
      }).catch((e) => {
        // eslint-disable-next-line no-console
        console.log(e.message)
      })
    })
  },
})
