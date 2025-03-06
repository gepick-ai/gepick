import { OAuthProvider } from "@gepick/auth/common"

export const OAUTH_PREFILIGHT_API = '/oauth/preflight'

export class OAuthPreflightRequestDto {
  constructor(
    /**
     * The OAuth provider to use.
     */
    public provider: OAuthProvider,
    /**
     * The URI to redirect to after the OAuth flow completes.
     */
    public redirectUri: string,
  ) {}
}

export class OAuthPreflightResponseDto {
  constructor(
    /**
     * The URI to redirect to for the OAuth flow.
     */
    public authUri: string,
  ) {}
}
