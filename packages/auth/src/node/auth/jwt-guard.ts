import { OAUTH_CALLBACK_API, OAUTH_PREFILIGHT_API, SEND_EMAIL_CAPTCHA_API, VERIFY_EMAIL_CAPTCHA_API } from '@gepick/auth/common';
import { InjectableService } from '@gepick/core/common';
import { IApplicationContribution } from '@gepick/core/node';
import { Application, RequestHandler, Router } from 'express';
import { expressjwt } from 'express-jwt';

/**
 * 创建 JWT 守卫
 * @param apiPrefix api前缀
 * @param whitelist 不需要验证的路径
 */

export function createJwtGuard(whitelist: string[], apiPrefix?: string): RequestHandler {
  return expressjwt({
    secret: process.env.JWT_SECRET ?? 'jwt_secret',
    algorithms: ['HS256'],
    requestProperty: 'user', // 将解码后的令牌信息附加到 req.user 上
  }).unless({
    path: whitelist.map(wl => apiPrefix + wl),
  });
}

// @Contribution(ApplicationContribution)
export class JwtGuard extends InjectableService implements IApplicationContribution {
  onApplicationInit(router: Router, app: Application): void {
    const API_PREFIX = '/api';

    app.use(API_PREFIX, (req, res, next) => {
      const handleErrorNext = (err: any) => {
        if (err) {
          if (
            err.name === 'UnauthorizedError'
            && err.inner.name === 'TokenExpiredError'
          ) {
            res.json({
              code: 401,
              message: "jwt expired",
            });
            return;
          }
        }
        next(err);
      };
      const middleware = createJwtGuard([
        OAUTH_PREFILIGHT_API,
        OAUTH_CALLBACK_API,
        SEND_EMAIL_CAPTCHA_API,
        VERIFY_EMAIL_CAPTCHA_API,
      ], API_PREFIX);

      middleware(req, res, handleErrorNext);
    }, router);
  }
}
