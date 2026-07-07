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

  // Envoi générique best-effort : retourne true si l'email est parti, false sinon.
  // L'appelant ne doit jamais échouer à cause d'un email non envoyé.
  private async send(to: string, subject: string, text: string, html: string): Promise<boolean> {
    const transporter = this.getTransporter();
    if (!transporter) return false;
    try {
      await transporter.sendMail({
        from: `"Passeport Santé" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text,
        html,
      });
      return true;
    } catch (err) {
      this.logger.error(`Échec de l'envoi de l'email « ${subject} »`, err as Error);
      return false;
    }
  }

  // Nouveau mot de passe après réinitialisation par un admin.
  async sendNewPassword(to: string, name: string, password: string): Promise<boolean> {
    return this.send(
      to,
      "Votre mot de passe a été réinitialisé",
      `Bonjour ${name},\n\n` +
        `Votre mot de passe Passeport Santé a été réinitialisé.\n\n` +
        `Nouveau mot de passe : ${password}\n\n` +
        `Nous vous conseillons de le modifier après votre prochaine connexion.\n\n` +
        `— L'équipe Passeport Santé`,
      `<p>Bonjour <strong>${name}</strong>,</p>` +
        `<p>Votre mot de passe Passeport Santé a été réinitialisé.</p>` +
        `<p>Nouveau mot de passe : <strong style="font-family:monospace;font-size:16px">${password}</strong></p>` +
        `<p style="color:#6b7280">Nous vous conseillons de le modifier après votre prochaine connexion.</p>` +
        `<p>— L'équipe Passeport Santé</p>`,
    );
  }

  // Email de bienvenue à la création d'un compte, avec ses identifiants.
  async sendAccountCreated(to: string, name: string, password: string): Promise<boolean> {
    return this.send(
      to,
      "Votre compte Passeport Santé a été créé",
      `Bonjour ${name},\n\n` +
        `Un compte Passeport Santé vient d'être créé pour vous.\n\n` +
        `Identifiant (email) : ${to}\n` +
        `Mot de passe : ${password}\n\n` +
        `Vous pouvez vous connecter dès maintenant. Nous vous conseillons de modifier votre mot de passe après votre première connexion.\n\n` +
        `— L'équipe Passeport Santé`,
      `<p>Bonjour <strong>${name}</strong>,</p>` +
        `<p>Un compte Passeport Santé vient d'être créé pour vous.</p>` +
        `<p><strong>Identifiant (email) :</strong> ${to}<br/>` +
        `<strong>Mot de passe :</strong> <strong style="font-family:monospace;font-size:16px">${password}</strong></p>` +
        `<p style="color:#6b7280">Vous pouvez vous connecter dès maintenant. Nous vous conseillons de modifier votre mot de passe après votre première connexion.</p>` +
        `<p>— L'équipe Passeport Santé</p>`,
    );
  }
}
