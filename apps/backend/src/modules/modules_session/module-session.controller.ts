import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
  UseGuards,
} from "@nestjs/common";
import { ModuleSessionService } from "./module-session.services";
import { CreateModuleSessionDto } from "./dto/create-module.dto";
import { UpdateModuleSessionDto } from "./dto/update-module.dto";
import { ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { CurrentUser, AuthUser } from "../../auth/decorators/current-user.decorator";

@ApiBearerAuth()
@Controller("module-sessions")
export class ModuleSessionController {
  constructor(private readonly moduleSessionService: ModuleSessionService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateModuleSessionDto, @CurrentUser() user: AuthUser) {
    return this.moduleSessionService.create(dto, user.organizationId, user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.moduleSessionService.findAll(user);
  }

  // Public : utilisé par les élèves/invités pour rejoindre une session via le code d'accès
  @Get("by-code/:code")
  async findByCode(@Param("code") code: string) {
    const session = await this.moduleSessionService.findByCode(code);
    if (!session) throw new NotFoundException("Session introuvable");
    return session;
  }

  @UseGuards(JwtAuthGuard)
  @Get(":id")
  async findOne(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    const session = await this.moduleSessionService.findOne(id, user);
    if (!session) throw new NotFoundException("Session introuvable");
    return session;
  }

  @UseGuards(JwtAuthGuard)
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateModuleSessionDto, @CurrentUser() user: AuthUser) {
    return this.moduleSessionService.update(id, user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  remove(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.moduleSessionService.remove(id, user);
  }
}
