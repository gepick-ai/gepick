// Request<ParamsDictionary/*路径参数 */, ResBody/* 响应体*/, ReqBody* 请求体*/, ReqQuery/*查询参数 */, Locals>/*本地变量 */

import { Request, Router } from "express"
import { SEND_EMAIL_CAPTCHA_API, SendEmailCaptchaRequestDto, VERIFY_EMAIL_CAPTCHA_API, VerifyEmailCaptchaRequestDto } from "@gepick/auth/common"
import { Contribution, InjectableService } from '@gepick/core/common';
import { ApplicationContribution, IApplicationContribution } from '@gepick/core/node';
import { IAuthService } from './auth-service';
import { IJwtService } from './jwt-service';
import { IMailService } from './mail-service';

/**
 * 1.获取用户发送的email
 * 2.创建随机验证码并发送到用户email
 * 3.将验证码存储起来等待校验使用（email-captcha）
 *
 * 4.获取用户输入的验证码与存储的验证码进行比对
 * 5.比对失败则返回错误信息
 * 6.比对成功判断该邮箱是否已经注册
 * 7.未注册则创建用户信息，然后返回用户信息
 * 8.已注册则返回用户信息
 * 9.生成token并返回
 */

const captchaMap = new Map<string, string>();

@Contribution(ApplicationContribution)
export class AuthController extends InjectableService implements IApplicationContribution {
  constructor(
    @IAuthService private readonly authService: IAuthService,
    @IJwtService private readonly jwtService: IJwtService,
    @IMailService private readonly mailService: IMailService,
  ) {
    super()
  }

  onApplicationConfigure(app: Router): void {
    interface ISendEmailCaptchaRequest extends Request<any, any, SendEmailCaptchaRequestDto> { }

    app.post(SEND_EMAIL_CAPTCHA_API, async (req: ISendEmailCaptchaRequest, res) => {
      const { email } = req.body;
      const captcha = String(Math.floor(Math.random() * 1000000)).padEnd(6, '0');

      captchaMap.set(email, captcha);

      // 发送邮件
      await this.mailService.sendMail({
        to: email,
        subject: "Gepick登录验证",
        text: `
      您正在请求通过电子邮件登录Gepick,
      您的登录验证码为：\n ${captcha}。 \n请勿将此验证码转发或提供给任何人。
      `,
      })

      res.end()
    })

    interface IVerifyEmailCaptchaRequest extends Request<any, any, VerifyEmailCaptchaRequestDto> { }

    app.post(VERIFY_EMAIL_CAPTCHA_API, async (req: IVerifyEmailCaptchaRequest, res) => {
      try {
        const { email, captcha } = req.body;
        const storedCaptcha = captchaMap.get(email);

        if (storedCaptcha !== captcha) {
          res.json(false);
          return;
        }

        captchaMap.delete(email);

        const user = await this.authService.signInFromEmail(email)
        const token = this.jwtService.sign({ id: user.id, name: user.name });

        res.send({
          token,
          redirectUri: "/",
        });
      }
      catch (err) {
        console.error(err);
      }
    })
  }
}
