export const SEND_EMAIL_CAPTCHA_API = '/auth/send-email-captcha'

export class SendEmailCaptchaRequestDto {
  constructor(
    public email: string,
  ) { }
}
