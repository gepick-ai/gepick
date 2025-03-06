export interface OAuthAccount {
  id: string
  email: string
  name: string
  avatarUrl?: string
}

export interface OauthTokens {
  accessToken: string
  scope?: string
  refreshToken?: string
  expiresAt?: Date
}
