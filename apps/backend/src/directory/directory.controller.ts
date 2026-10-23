import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { DirectoryService } from "./directory.service";

@ApiBearerAuth()
@Controller("directory")
export class DirectoryController {
  constructor(private readonly directoryService: DirectoryService) {}

  // Recherche d'un collège dans l'annuaire de l'Éducation nationale
  // (création / rattachement d'un établissement, réservé aux admins).
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiQuery({ name: "q", example: "jean moulin nancy" })
  @Get("colleges")
  searchColleges(@Query("q") q = "") {
    return this.directoryService.searchColleges(String(q));
  }
}
