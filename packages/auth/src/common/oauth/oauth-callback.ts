import { OAuthProvider } from "@gepick/auth/common"

export const OAUTH_CALLBACK_API = '/oauth/callback'

export class OAuthCallbackRequestDto {
  constructor(
    public code: string,
    public state: string,
    public provider: OAuthProvider,
  ) {}
}

export class OauthCallbackResponseDto {
  constructor(
    public redirectUri: string,
    public token: string,
  ) {}
}
