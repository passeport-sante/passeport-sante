import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { PrismaService } from "@/prisma/prisma.service";
import { MailService } from "../mail/mail.service";
import * as bcrypt from "bcrypt";

// Génère un mot de passe robuste (8 caractères, ≥1 majuscule, ≥1 chiffre, ≥1 spécial).
// Caractères ambigus (0/O, 1/l/I) exclus pour faciliter la lecture manuelle.
function generatePassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const specials = "!@#$%&*";
  const all = upper + lower + digits + specials;
  const pick = (s: string) => s[Math.floor(Math.random() * s.length)]!;
  const chars = [pick(upper), pick(digits), pick(specials), ...Array.from({ length: 5 }, () => pick(all))];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j]!, chars[i]!];
  }
  return chars.join("");
}

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private mail: MailService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    try {
      return await this.prisma.user.create({
        data: { ...createUserDto, email: createUserDto.email.trim().toLowerCase(), password: hashedPassword },
      });
    } catch (e: any) {
      if (e?.code === "P2002") throw new ConflictException("Un compte avec cet email existe déjà");
      throw e;
    }
  }

  findAll() {
    return this.prisma.user.findMany({
      omit: { password: true },
      include: { organization: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      omit: { password: true },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const { password, ...rest } = updateUserDto;
    const data: Record<string, unknown> = { ...rest };
    if (data.email && typeof data.email === "string") {
      data.email = data.email.trim().toLowerCase();
    }
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }
    try {
      return await this.prisma.user.update({ where: { id }, data });
    } catch (e: any) {
      if (e?.code === "P2002") throw new ConflictException("Un compte avec cet email existe déjà");
      throw e;
    }
  }

  // Réinitialise le mot de passe : génère un nouveau mot de passe côté serveur,
  // le stocke haché, et l'envoie par email au destinataire. Le mot de passe en clair
  // n'est renvoyé qu'une seule fois (pour affichage dans la modale admin).
  async resetPassword(id: string): Promise<{ password: string; emailSent: boolean }> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("Compte introuvable");

    const password = generatePassword();
    const hashedPassword = await bcrypt.hash(password, 10);
    await this.prisma.user.update({ where: { id }, data: { password: hashedPassword } });

    const emailSent = await this.mail.sendNewPassword(user.email, user.name, password);
    return { password, emailSent };
  }

  remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}
