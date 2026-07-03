import { Injectable, Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  private getTransporter(): nodemailer.Transporter | null {
    const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      this.logger.error("Variables SMTP manquantes — email non envoyé");
      return null;
    }
    const port = Number(process.env.SMTP_PORT ?? 465);
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }

  // Envoie au destinataire son nouveau mot de passe après réinitialisation par un admin.
  // Retourne true si l'email est bien parti, false sinon (l'appelant ne doit pas échouer pour autant).
  async sendNewPassword(to: string, name: string, password: string): Promise<boolean> {
    const transporter = this.getTransporter();
    if (!transporter) return false;

    try {
      await transporter.sendMail({
        from: `"Passeport Santé" <${process.env.SMTP_USER}>`,
        to,
        subject: "Votre mot de passe a été réinitialisé",
        text:
          `Bonjour ${name},\n\n` +
          `Votre mot de passe Passeport Santé a été réinitialisé.\n\n` +
          `Nouveau mot de passe : ${password}\n\n` +
          `Nous vous conseillons de le modifier après votre prochaine connexion.\n\n` +
          `— L'équipe Passeport Santé`,
        html:
          `<p>Bonjour <strong>${name}</strong>,</p>` +
          `<p>Votre mot de passe Passeport Santé a été réinitialisé.</p>` +
          `<p>Nouveau mot de passe : <strong style="font-family:monospace;font-size:16px">${password}</strong></p>` +
          `<p style="color:#6b7280">Nous vous conseillons de le modifier après votre prochaine connexion.</p>` +
          `<p>— L'équipe Passeport Santé</p>`,
      });
      return true;
    } catch (err) {
      this.logger.error("Échec de l'envoi de l'email de réinitialisation", err as Error);
      return false;
    }
  }
}
