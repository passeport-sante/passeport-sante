import { PrismaService } from "@/prisma/prisma.service";
import { MailService } from "../mail/mail.service";
import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 heure

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mail: MailService,
    private config: ConfigService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  // Demande de réinitialisation : génère un token, stocke son hash + expiration, envoie le lien.
  // Réponse volontairement identique que le compte existe ou non (pas d'énumération d'emails).
  async requestPasswordReset(email: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || user.isSuspended) return;

    const token = crypto.randomBytes(32).toString("hex");
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetTokenHash: this.hashToken(token),
        resetTokenExpiry: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    const baseUrl = this.config.get<string>("FRONTEND_URL") ?? "http://localhost:3000";
    const link = `${baseUrl}/reset-password?token=${token}`;
    await this.mail.sendPasswordResetLink(user.email, user.name, link);
  }

  // Réinitialisation effective : valide le token (non expiré) et applique le nouveau mot de passe.
  async resetPassword(token: string, newPassword: string): Promise<void> {
    if (!token || newPassword.length < 8) {
      throw new BadRequestException("Lien invalide ou mot de passe trop court (min. 8 caractères)");
    }
    const user = await this.prisma.user.findFirst({
      where: {
        resetTokenHash: this.hashToken(token),
        resetTokenExpiry: { gt: new Date() },
      },
    });
    if (!user) throw new BadRequestException("Lien invalide ou expiré");

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: await bcrypt.hash(newPassword, 10),
        resetTokenHash: null,
        resetTokenExpiry: null,
      },
    });
  }

  async validateUser(email: string, password: string): Promise<any> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (user && !user.isSuspended && (await bcrypt.compare(password, user.password))) {
      const { password: _password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    return {
      access_token: this.jwtService.sign({
        sub: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      }),
    };
  }
}
