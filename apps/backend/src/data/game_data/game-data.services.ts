import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateGameDataDto } from "./dto/create-datum.dto";
import { UpdateGameDataDto } from "./dto/update-datum.dto";

@Injectable()
export class GameDataService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateGameDataDto) {
    return this.prisma.gameData.create({ data: dto });
  }

  findAll() {
    return this.prisma.gameData.findMany();
  }

  findOne(id: string) {
    return this.prisma.gameData.findUnique({ where: { id } });
  }

  update(id: string, dto: UpdateGameDataDto) {
    return this.prisma.gameData.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.gameData.delete({ where: { id } });
  }
}
