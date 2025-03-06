import { userService } from '@gepick/user/node'

class AuthService {
  async signInFromEmail(email: string) {
    let user = await userService.findUserByEmail(email)

    if (user) {
      return user
    }

    user = await userService.createUser({
      name: email.split("@")[0],
      email,
      avatarUrl: "",
    })

    return user!;
  }
}

export const authService = new AuthService()
