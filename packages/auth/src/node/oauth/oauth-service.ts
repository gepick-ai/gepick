import { OAuthProvider } from "@gepick/auth/common"
import { IUserService } from "@gepick/user/node"
import { InjectableService } from '@gepick/core/common'
import { OAuthAccount, OauthTokens } from './provider-types';

export class OAuthService extends InjectableService {
  constructor(
    @IUserService private userService: IUserService,
  ) {
    super();
  }

  async signInFromOauth(provider: OAuthProvider, externalAccount: OAuthAccount, tokens: OauthTokens) {
    let user = await this.userService.findUserByProvider({
      provider,
      providerAccountId: externalAccount.id,
    })

    if (user) {
      await this.userService.updateUser({
        id: user.id,
        ...tokens,
      })

      return user;
    }

    user = await this.userService.createUser({
      provider,
      providerAccountId: externalAccount.id,
      name: externalAccount.name,
      avatarUrl: externalAccount.avatarUrl ?? "",
    })

    return user!;
  }
}

export const IOAuthService = OAuthService.getServiceDecorator()
export type IOAuthService = OAuthService
