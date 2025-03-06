export const VERIFY_EMAIL_CAPTCHA_API = '/auth/verify-email-captcha'

export class VerifyEmailCaptchaRequestDto {
  constructor(
    public email: string,
    public captcha: string,
  ) {}
}

export class VerifyEmailCaptchaResponseDto {
  constructor(
    public redirectUri: string,
    public token: string,
  ) {}
}
