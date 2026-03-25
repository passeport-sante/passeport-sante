import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from "@nestjs/common";
import { ModuleProgressService } from "./module-progress.services";
import { CreateModuleProgressDto } from "./dto/create-module.dto";
import { UpdateModuleProgressDto } from "./dto/update-module.dto";
import { ApiBearerAuth } from "@nestjs/swagger";

@ApiBearerAuth()
@Controller("modules/progress")
export class ModuleProgressController {
  constructor(private readonly moduleProgressService: ModuleProgressService) {}

  @Post()
  create(@Body() dto: CreateModuleProgressDto) {
    return this.moduleProgressService.create(dto);
  }

  @Get()
  findAll() {
    return this.moduleProgressService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.moduleProgressService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateModuleProgressDto) {
    return this.moduleProgressService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.moduleProgressService.remove(id);
  }
}
