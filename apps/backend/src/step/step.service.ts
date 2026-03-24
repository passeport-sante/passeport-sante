import { Injectable } from "@nestjs/common";
import { CreateStepDto } from "./dto/create-step.dto";
import { UpdateStepDto } from "./dto/update-step.dto";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class StepService {
  constructor(private prisma: PrismaService) {}

  create(createStepDto: CreateStepDto) {
    return this.prisma.step.create({
      data: createStepDto,
    });
  }

  findAll() {
    return this.prisma.step.findMany();
  }

  findOne(id: string) {
    return this.prisma.step.findUnique({
      where: { id },
    });
  }

  update(id: string, updateStepDto: UpdateStepDto) {
    return this.prisma.step.update({
      where: { id },
      data: updateStepDto,
    });
  }

  remove(id: string) {
    return this.prisma.step.delete({
      where: { id },
    });
  }
}
