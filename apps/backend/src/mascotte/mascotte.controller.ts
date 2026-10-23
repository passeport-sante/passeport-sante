import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
} from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { MascotteService } from "./mascotte.service";
import { CreateMascotteDto } from "./dto/create-mascotte.dto";
import { UpdateMascotteDto } from "./dto/update-mascotte.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiBearerAuth()
@Controller("mascotte")
export class MascotteController {
  constructor(private readonly mascotteService: MascotteService) {}

  // Lecture ouverte : le catalogue sert aussi au rendu côté élève.
  @Get()
  findAll() {
    return this.mascotteService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Post()
  create(@Body() dto: CreateMascotteDto) {
    return this.mascotteService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateMascotteDto) {
    return this.mascotteService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id") id: string) {
    return this.mascotteService.remove(id);
  }
}
