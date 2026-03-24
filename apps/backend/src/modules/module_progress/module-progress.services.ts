import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateModuleProgressDto } from "./dto/create-module.dto";
import { UpdateModuleProgressDto } from "./dto/update-module.dto";

@Injectable()
export class ModuleProgressService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateModuleProgressDto) {
    return this.prisma.moduleProgress.create({ data: dto });
  }

  findAll() {
    return this.prisma.moduleProgress.findMany();
  }

  findOne(id: string) {
    return this.prisma.moduleProgress.findUnique({ where: { id } });
  }

  update(id: string, dto: UpdateModuleProgressDto) {
    return this.prisma.moduleProgress.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.moduleProgress.delete({ where: { id } });
  }
}
