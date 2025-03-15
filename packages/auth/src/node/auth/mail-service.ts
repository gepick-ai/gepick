import { Transporter, createTransport } from "nodemailer"
import SMTPTransport from 'nodemailer/lib/smtp-transport'
import { InjectableService } from '@gepick/core/common'

export class MailService extends InjectableService {
  private transporter: Transporter<SMTPTransport.SentMessageInfo>

  constructor() {
    super();

    this.transporter = createTransport({
      host: "smtpout.secureserver.net",
      port: 465,
      secure: true,
      auth: {
        user: process.env.MAIL_USER ?? 'support@gpt4o.jp',
        pass: process.env.MAIL_PASSWORD ?? 'Dm$rFQH$m4?n-bZ',
      },
    })

    this.verifyConnection()
  }

  async sendMail(options: SMTPTransport.Options) {
    try {
      const result = await this.transporter.sendMail({
        from: 'support@gpt4o.jp',
        ...options,
      });

      return result;
    }
    catch (err) {
      console.error(err);
      throw err;
    }
  }

  private async verifyConnection() {
    try {
      await this.transporter.verify();

      // console.log('SMTP connection verified successfully');
    }
    catch (error: any) {
      console.error('SMTP verification failed:', error);
      throw new Error(`SMTP verification failed: ${error.message}`);
    }
  }
}

export const IMailService = MailService.createServiceDecorator()
export type IMailService = MailService
