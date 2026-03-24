import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateQuizResponseDto } from "./dto/create-response.dto";
import { UpdateQuizResponseDto } from "./dto/update-response.dto";

@Injectable()
export class QuizResponseService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateQuizResponseDto) {
    return this.prisma.quizResponse.create({ data: dto });
  }

  findAll() {
    return this.prisma.quizResponse.findMany();
  }

  findOne(id: string) {
    return this.prisma.quizResponse.findUnique({ where: { id } });
  }

  update(id: string, dto: UpdateQuizResponseDto) {
    return this.prisma.quizResponse.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.quizResponse.delete({ where: { id } });
  }
}
