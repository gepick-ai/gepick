import { RequestHandler } from 'express';
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
