import jwt from 'jsonwebtoken'
import { InjectableService } from '@gepick/core/common'

interface JwtPayload {
  name: string
  id: string
}

export class JwtService extends InjectableService {
  sign(payload: JwtPayload) {
    return jwt.sign(payload, process.env.JWT_SECRET ?? "jwt_secret", { expiresIn: "1d" })
  }

  verify(token: string) {
    return jwt.verify(token, process.env.JWT_SECRET ?? "jwt_secret")
  }
}

export const IJwtService = JwtService.getServiceDecorator()
export type IJwtService = JwtService
