import { OAuthAccount, OauthTokens } from '@gepick/auth/node'
import { OAuthProvider } from "@gepick/auth/common"
import { userService } from "@gepick/user/node"

export class OauthService {
  async signInFromOauth(provider: OAuthProvider, externalAccount: OAuthAccount, tokens: OauthTokens) {
    let user = await userService.findUserByProvider({
      provider,
      providerAccountId: externalAccount.id,
    })

    if (user) {
      await userService.updateUser({
        id: user.id,
        ...tokens,
      })

      return user;
    }

    user = await userService.createUser({
      provider,
      providerAccountId: externalAccount.id,
      name: externalAccount.name,
      avatarUrl: externalAccount.avatarUrl ?? "",
    })

    return user!;
  }
}

export const oauthService = new OauthService()
