import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from "@nestjs/common";
import { ModulesService } from "./modules.service";
import { CreateModuleDto } from "./dto/create-module.dto";
import { UpdateModuleDto } from "./dto/update-module.dto";
import { ApiBearerAuth, ApiQuery } from "@nestjs/swagger";

@ApiBearerAuth()
@Controller("modules")
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @Post()
  create(@Body() createModuleDto: CreateModuleDto) {
    return this.modulesService.create(createModuleDto);
  }

  @Get()
  @ApiQuery({ name: "grouped", required: false, type: Boolean, description: "Retourne les modules groupés par catégorie" })
  findAll(@Query("grouped") grouped?: string) {
    if (grouped === "true") {
      return this.modulesService.findAllGrouped();
    }
    return this.modulesService.findAll();
  }

  @Get("slug/:slug")
  findBySlug(@Param("slug") slug: string) {
    return this.modulesService.findBySlug(slug);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.modulesService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateModuleDto: UpdateModuleDto) {
    return this.modulesService.update(id, updateModuleDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.modulesService.remove(id);
  }
}
