import { ContentType, InjectableService, createServiceDecorator } from '@gepick/core/common'
import { nodeMessagingService } from "@gepick/core/node"

const GOOGLE_OAUTH_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID ?? "348471034017-pn5hs4mn83ul07bmmfsnmg5evf3ro3q8.apps.googleusercontent.com"
const GOOGLE_OAUTH_CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? "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"
const GOOGLE_OAUTH_REDIRECT_URI = process.env.GOOGLE_OAUTH_REDIRECT_URI ?? `http://localhost:8080/oauth/callback`

export interface GoogleUserInfo {
  id: string
  email: string
  picture: string
  name: string
}

export class GoogleOAuthProvider extends InjectableService {
  getAuthUri() {
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const scope = 'openid email profile';
    const prompt = 'select_account'
    const responseType = 'code';
    const access_type = 'offline'

    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_OAUTH_CLIENT_ID}&redirect_uri=${GOOGLE_OAUTH_REDIRECT_URI}&response_type=${responseType}&scope=${scope}&state=${state}&prompt=${prompt}&access_type=${access_type}`;
  }

  async getToken(code: string) {
    interface GoogleOauthResponse {
      access_token: string
      expires_in: number
      refresh_token: string
      scope: string
      token_type: string
    }

    const [error, response] = await nodeMessagingService.post<GoogleOauthResponse>('https://oauth2.googleapis.com/token', {
      code,
      client_id: GOOGLE_OAUTH_CLIENT_ID,
      client_secret: GOOGLE_OAUTH_CLIENT_SECRET,
      redirect_uri: GOOGLE_OAUTH_REDIRECT_URI,
      grant_type: "authorization_code",
    }, {
      'Content-Type': ContentType.UrlEncoded,
    });

    if (response) {
      return {
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        expiresAt: new Date(Date.now() + response.expires_in * 1000),
        scope: response.scope,
      };
    }
    else {
      throw new Error(`Failed to get google oauth token: ${error?.message ?? error}`);
    }
  }

  async getUser(token: string) {
    const [error, response] = await nodeMessagingService.get<GoogleUserInfo>(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        access_token: token,
      },
    );

    if (response) {
      const user = response;

      return {
        id: user.id,
        avatarUrl: user.picture,
        email: user.email,
        name: user.name,
      };
    }
    else {
      throw new Error(
        `Failed to get google user info: ${error}`,
      );
    }
  }
}

export const IGoogleOAuthProvider = createServiceDecorator<IGoogleOAuthProvider>("GoogleOAuthProvider");
export type IGoogleOAuthProvider = GoogleOAuthProvider;
