// Request<ParamsDictionary/*路径参数 */, ResBody/* 响应体*/, ReqBody* 请求体*/, ReqQuery/*查询参数 */, Locals>/*本地变量 */

import { Request, Router } from "express"
import { Contribution, InjectableService } from '@gepick/core/common';
import { ApplicationContribution, IApplicationContribution } from '@gepick/core/node';
import { OAUTH_CALLBACK_API, OAUTH_PREFILIGHT_API, OAuthCallbackRequestDto, OAuthPreflightRequestDto, OAuthPreflightResponseDto, OAuthProvider } from '@gepick/auth/common';
import { IJwtService } from '../auth';
import { IGoogleOAuthProvider } from './google-provider';
import { IOAuthService } from './oauth-service';

@Contribution(ApplicationContribution)
export class OAuthController extends InjectableService implements IApplicationContribution {
  constructor(
    @IJwtService private readonly jwtService: IJwtService,
    @IOAuthService private readonly oauthService: IOAuthService,
    @IGoogleOAuthProvider private readonly provider: IGoogleOAuthProvider,
  ) {
    super()
  }

  onApplicationConfigure(app: Router): void {
    /**
     * Oauth预检
     */
    interface IOauthPrefilightRequest extends Request<any, any, OAuthPreflightRequestDto> { }

    app.post(OAUTH_PREFILIGHT_API, (req: IOauthPrefilightRequest, res) => {
      const { provider: oauthProvider } = req.body;

      switch (oauthProvider.toLocaleLowerCase()) {
        case "google":
          res.send(new OAuthPreflightResponseDto(this.provider.getAuthUri()));
          break;

        default: {
          res.status(404).send("Not found");
        }
      }
    })

    /**
     * Oauth登录
     */
    interface IOAuthCallbackRequest extends Request<any, any, OAuthCallbackRequestDto> { }

    app.post(OAUTH_CALLBACK_API, async (req: IOAuthCallbackRequest, res) => {
      const { code } = req.body;

      /**
       * 1、拿着code从对应provider获取对应的用户信息及token
       * 2、对数据库里头的用户信息进行更新或者插入
       */

      try {
        const tokens = await this.provider.getToken(code)
        const externAccount = await this.provider.getUser(tokens.accessToken);
        const user = await this.oauthService.signInFromOauth(
          OAuthProvider.Google,
          externAccount,
          tokens,
        );

        const token = this.jwtService.sign({ id: user.id, name: user.name });

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
}
