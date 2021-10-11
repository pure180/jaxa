import mailer, { TestAccount, Transporter } from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

export interface MailServiceProps {
  mailOptions: Mail.Options;
  options?: SMTPTransport.Options;
}

export class MailService {
  private mailOptions: SMTPTransport.MailOptions;

  private options: Mail.Options;

  private testAccount: TestAccount | undefined;

  private transporter: Transporter<SMTPTransport.SentMessageInfo> | undefined;

  constructor(props: MailServiceProps) {
    this.mailOptions = props.mailOptions;
    this.options = props.options || {};
  }

  public initialize = async () => {
    this.testAccount = await mailer.createTestAccount();
    this.transporter = mailer.createTransport({
      ...this.options,
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: this.testAccount.user,
        pass: this.testAccount.pass,
      },
    });
  };

  public send = async () => {
    await this.initialize();

    if (!this.transporter) {
      return undefined;
    }

    const info = await this.transporter.sendMail({
      from: 'Jaxa <info@daniel-pfisterer.de>',
      ...this.mailOptions,
    });

    console.log('Preview URL: %s', mailer.getTestMessageUrl(info));

    return info;
  };
}

export default MailService;
