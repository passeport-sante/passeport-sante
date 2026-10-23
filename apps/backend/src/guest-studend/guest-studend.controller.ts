import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from "@nestjs/common";
import { GuestStudendService } from "./guest-studend.service";
import { CreateGuestStudendDto } from "./dto/create-guest-studend.dto";
import { UpdateGuestStudendDto } from "./dto/update-guest-studend.dto";
import { ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiBearerAuth()
@Controller("guest-studend")
export class GuestStudendController {
  constructor(private readonly guestStudendService: GuestStudendService) {}

  // Public : un élève qui rejoint une session (diagnostic ou module).
  @Post()
  create(@Body() createGuestStudendDto: CreateGuestStudendDto) {
    return this.guestStudendService.create(createGuestStudendDto);
  }

  // Le reste touche aux élèves de tous les établissements : réservé aux admins.
  // Les enseignants passent par les routes de leurs sessions, limitées à leur établissement.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Get()
  findAll() {
    return this.guestStudendService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.guestStudendService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateGuestStudendDto: UpdateGuestStudendDto,
  ) {
    return this.guestStudendService.update(id, updateGuestStudendDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.guestStudendService.remove(id);
  }
}
