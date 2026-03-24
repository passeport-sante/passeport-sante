import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateStatisticsDataDto } from "./dto/create-datum.dto";
import { UpdateStatisticsDataDto } from "./dto/update-datum.dto";

@Injectable()
export class StatisticsDataService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateStatisticsDataDto) {
    return this.prisma.statisticsData.create({ data: dto });
  }

  findAll() {
    return this.prisma.statisticsData.findMany();
  }

  findOne(id: string) {
    return this.prisma.statisticsData.findUnique({ where: { id } });
  }

  update(id: string, dto: UpdateStatisticsDataDto) {
    return this.prisma.statisticsData.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.statisticsData.delete({ where: { id } });
  }
}
