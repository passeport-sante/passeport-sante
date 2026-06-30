import { ConflictException, Injectable } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { PrismaService } from "@/prisma/prisma.service";
import * as bcrypt from "bcrypt";

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

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

  remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}
