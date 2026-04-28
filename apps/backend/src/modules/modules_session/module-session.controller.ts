import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
} from "@nestjs/common";
import { ModuleSessionService } from "./module-session.services";
import { CreateModuleSessionDto } from "./dto/create-module.dto";
import { UpdateModuleSessionDto } from "./dto/update-module.dto";
import { ApiBearerAuth } from "@nestjs/swagger";

@ApiBearerAuth()
@Controller("module-sessions")
export class ModuleSessionController {
  constructor(private readonly moduleSessionService: ModuleSessionService) {}

  @Post()
  create(@Body() dto: CreateModuleSessionDto) {
    return this.moduleSessionService.create(dto);
  }

  @Get()
  findAll() {
    return this.moduleSessionService.findAll();
  }

  @Get("by-code/:code")
  async findByCode(@Param("code") code: string) {
    const session = await this.moduleSessionService.findByCode(code);
    if (!session) throw new NotFoundException("Session introuvable");
    return session;
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.moduleSessionService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateModuleSessionDto) {
    return this.moduleSessionService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.moduleSessionService.remove(id);
  }
}
