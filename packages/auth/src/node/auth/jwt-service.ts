import jwt from 'jsonwebtoken'

interface JwtPayload {
  name: string
  id: string
}

class JwtService {
  sign(payload: JwtPayload) {
    return jwt.sign(payload, process.env.JWT_SECRET ?? "jwt_secret", { expiresIn: "1d" })
  }

  verify(token: string) {
    return jwt.verify(token, process.env.JWT_SECRET ?? "jwt_secret")
  }
}

export const jwtService = new JwtService()
