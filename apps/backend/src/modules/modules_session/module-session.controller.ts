import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from "@nestjs/common";
import { ModuleSessionService } from "./module-session.services";
import { CreateModuleSessionDto } from "./dto/create-module.dto";
import { UpdateModuleSessionDto } from "./dto/update-module.dto";
import { ApiBearerAuth } from "@nestjs/swagger";

@ApiBearerAuth()
@Controller("modules/session")
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
