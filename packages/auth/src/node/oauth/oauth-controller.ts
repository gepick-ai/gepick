// Request<ParamsDictionary/*路径参数 */, ResBody/* 响应体*/, ReqBody* 请求体*/, ReqQuery/*查询参数 */, Locals>/*本地变量 */

import { Request, Router } from "express"
import { OAUTH_CALLBACK_API, OAUTH_PREFILIGHT_API, OAuthCallbackRequestDto, OAuthPreflightRequestDto, OAuthPreflightResponseDto, OAuthProvider } from "@gepick/auth/common"
import { jwtService, oauthService, googleOauthProvider as provider } from "@gepick/auth/node"

export function useOauthRouter(router: Router): void {
  /**
   * Oauth预检
   */
  interface IOauthPrefilightRequest extends Request<any, any, OAuthPreflightRequestDto> { }

  router.post(OAUTH_PREFILIGHT_API, (req: IOauthPrefilightRequest, res) => {
    const { provider: oauthProvider } = req.body;

    switch (oauthProvider.toLocaleLowerCase()) {
      case "google":
        res.send(new OAuthPreflightResponseDto(provider.getAuthUri()));
        break;

      default: {
        res.status(404).send("Not found");
      }
    }
  })

  /**
   * Oauth登录
   */
  interface IOauthCallbackRequest extends Request<any, any, OAuthCallbackRequestDto> { }

  router.post(OAUTH_CALLBACK_API, async (req: IOauthCallbackRequest, res) => {
    const { code } = req.body;

    /**
     * 1、拿着code从对应provider获取对应的用户信息及token
     * 2、对数据库里头的用户信息进行更新或者插入
     */

    try {
      const tokens = await provider.getToken(code)
      const externAccount = await provider.getUser(tokens.accessToken);
      const user = await oauthService.signInFromOauth(
        OAuthProvider.Google,
        externAccount,
        tokens,
      );

      const token = jwtService.sign({ id: user.id, name: user.name });

      res.send({
        token,
        redirectUri: "/",
      });
    }
    catch (err) {
      console.error(err);
    }
  })
}
