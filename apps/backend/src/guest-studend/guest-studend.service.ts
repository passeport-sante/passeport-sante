import { Injectable } from "@nestjs/common";
import { CreateGuestStudendDto } from "./dto/create-guest-studend.dto";
import { UpdateGuestStudendDto } from "./dto/update-guest-studend.dto";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class GuestStudendService {
  constructor(private prisma: PrismaService) {}

  create(CreateGuestStudendDto: CreateGuestStudendDto) {
    return this.prisma.guestStudent.create({
      data: CreateGuestStudendDto,
    });
  }

  findAll() {
    return this.prisma.guestStudent.findMany();
  }

  findOne(id: string) {
    return this.prisma.guestStudent.findUnique({ where: { id } });
  }

  update(id: string, updateGuestStudendDto: UpdateGuestStudendDto) {
    return this.prisma.guestStudent.update({
      where: { id },
      data: updateGuestStudendDto,
    });
  }

  remove(id: string) {
    return this.prisma.guestStudent.delete({ where: { id } });
  }
}
