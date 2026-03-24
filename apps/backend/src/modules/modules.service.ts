import { Injectable } from '@nestjs/common';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class ModulesService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateModuleDto) {
    return this.prisma.module.create({ data: dto });
  }

  findAll() {
    return this.prisma.module.findMany();
  }

  findOne(id: string) {
    return this.prisma.module.findUnique({ where: { id } });
  }

  update(id: string, dto: UpdateModuleDto) {
    return this.prisma.module.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.module.delete({ where: { id } });
  }
}
