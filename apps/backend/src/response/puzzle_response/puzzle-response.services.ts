import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreatePuzzleResponseDto } from "./dto/create-response.dto";
import { UpdatePuzzleResponseDto } from "./dto/update-response.dto";

@Injectable()
export class PuzzleResponseService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreatePuzzleResponseDto) {
    return this.prisma.puzzleResponse.create({ data: dto });
  }

  findAll() {
    return this.prisma.puzzleResponse.findMany();
  }

  findOne(id: string) {
    return this.prisma.puzzleResponse.findUnique({ where: { id } });
  }

  update(id: string, dto: UpdatePuzzleResponseDto) {
    return this.prisma.puzzleResponse.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.puzzleResponse.delete({ where: { id } });
  }
}
