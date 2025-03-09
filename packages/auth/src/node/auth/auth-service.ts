import { InjectableService } from '@gepick/core/common';
import { IUserService } from '@gepick/user/node'

export class AuthService extends InjectableService {
  constructor(
    @IUserService private readonly userService: IUserService,
  ) {
    super();
  }

  async signInFromEmail(email: string) {
    let user = await this.userService.findUserByEmail(email)

    if (user) {
      return user
    }

    user = await this.userService.createUser({
      name: email.split("@")[0],
      email,
      avatarUrl: "",
    })

    return user!;
  }
}

export const IAuthService = AuthService.getServiceDecorator()
export type IAuthService = AuthService
