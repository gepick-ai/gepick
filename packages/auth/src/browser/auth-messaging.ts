import { messagingService } from "@gepick/core/browser"
import { OAUTH_CALLBACK_API, OAUTH_PREFILIGHT_API, OAuthCallbackRequestDto, OAuthPreflightRequestDto, OAuthPreflightResponseDto, OauthCallbackResponseDto, SEND_EMAIL_CAPTCHA_API, SendEmailCaptchaRequestDto, VERIFY_EMAIL_CAPTCHA_API, VerifyEmailCaptchaRequestDto, VerifyEmailCaptchaResponseDto } from "@gepick/auth/common"

/**
 * Oauth预检
 */
export async function preflightOauth(params: OAuthPreflightRequestDto) {
  const [_err, res] = await messagingService.post<OAuthPreflightResponseDto, OAuthPreflightRequestDto>(OAUTH_PREFILIGHT_API, params);

  if (res) {
    return res;
  }

  throw new Error('Failed to get preflight oauth response');
}

/**
 * Oauth登录
 */
export async function signInOauth(params: OAuthCallbackRequestDto) {
  const [_err, res] = await messagingService.post<OauthCallbackResponseDto, OAuthCallbackRequestDto>(OAUTH_CALLBACK_API, params)

  if (res) {
    return res;
  }

  throw new Error("Failed to get sign in oauth response")
}

/**
 * 发送邮箱验证码
 */
export async function sendEmailCaptcha(params: SendEmailCaptchaRequestDto) {
  const [_err, res] = await messagingService.post<void, SendEmailCaptchaRequestDto>(SEND_EMAIL_CAPTCHA_API, params);

  if (res) {
    return res;
  }

  throw new Error('Failed to send email captcha');
}

/**
 * 邮箱登录
 */
export async function signInEmail(params: VerifyEmailCaptchaRequestDto) {
  const [_err, res] = await messagingService.post<VerifyEmailCaptchaResponseDto, VerifyEmailCaptchaRequestDto>(VERIFY_EMAIL_CAPTCHA_API, params);

  if (res) {
    return res;
  }

  throw new Error('Failed to verify email captcha');
}
