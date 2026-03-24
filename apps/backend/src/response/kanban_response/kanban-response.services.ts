import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateKanbanResponseDto } from "./dto/create-response.dto";
import { UpdateKanbanResponseDto } from "./dto/update-response.dto";

@Injectable()
export class KanbanResponseService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateKanbanResponseDto) {
    return this.prisma.kanbanResponse.create({ data: dto });
  }

  findAll() {
    return this.prisma.kanbanResponse.findMany();
  }

  findOne(id: string) {
    return this.prisma.kanbanResponse.findUnique({ where: { id } });
  }

  update(id: string, dto: UpdateKanbanResponseDto) {
    return this.prisma.kanbanResponse.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.kanbanResponse.delete({ where: { id } });
  }
}