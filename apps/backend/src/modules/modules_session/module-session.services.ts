import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateModuleSessionDto } from "./dto/create-module.dto";
import { UpdateModuleSessionDto } from "./dto/update-module.dto";

@Injectable()
export class ModuleSessionService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateModuleSessionDto) {
    return this.prisma.moduleSession.create({ data: dto });
  }

  findAll() {
    return this.prisma.moduleSession.findMany();
  }

  findOne(id: string) {
    return this.prisma.moduleSession.findUnique({ where: { id } });
  }

  update(id: string, dto: UpdateModuleSessionDto) {
    return this.prisma.moduleSession.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.moduleSession.delete({ where: { id } });
  }
}
