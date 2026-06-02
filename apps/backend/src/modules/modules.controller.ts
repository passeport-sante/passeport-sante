import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ModulesService } from "./modules.service";
import { CreateModuleDto } from "./dto/create-module.dto";
import { UpdateModuleDto } from "./dto/update-module.dto";
import { ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiBearerAuth()
@Controller("modules")
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Post()
  create(@Body() createModuleDto: CreateModuleDto) {
    return this.modulesService.create(createModuleDto);
  }

  @Get()
  @ApiQuery({ name: "grouped", required: false, type: Boolean, description: "Retourne les modules groupés par catégorie" })
  @ApiQuery({ name: "admin", required: false, type: Boolean, description: "Vue admin (inclut inactifs, métadonnées étendues)" })
  findAll(@Query("grouped") grouped?: string, @Query("admin") admin?: string) {
    if (grouped === "true") {
      return this.modulesService.findAllGrouped();
    }
    if (admin === "true") {
      return this.modulesService.findAllAdmin();
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Patch(":id")
  update(@Param("id") id: string, @Body() updateModuleDto: UpdateModuleDto) {
    return this.modulesService.update(id, updateModuleDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Post(":id/duplicate")
  duplicate(@Param("id") id: string) {
    return this.modulesService.duplicate(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.modulesService.remove(id);
  }
}
