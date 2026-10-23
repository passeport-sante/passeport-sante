import { Controller, Get, Post, Param, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { ModuleVersionsService } from "./module-versions.service";
import { ListVersionsQueryDto } from "./dto/list-versions-query.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser, AuthUser } from "../auth/decorators/current-user.decorator";

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
@Controller("modules/:moduleId/versions")
export class ModuleVersionsController {
  constructor(private readonly moduleVersionsService: ModuleVersionsService) {}

  @Get()
  list(@Param("moduleId") moduleId: string, @Query() query: ListVersionsQueryDto) {
    return this.moduleVersionsService.listVersions(moduleId, query);
  }

  @Post(":versionId/restore")
  restore(
    @Param("moduleId") moduleId: string,
    @Param("versionId") versionId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.moduleVersionsService.restoreVersion(moduleId, versionId, user.userId);
  }
}
