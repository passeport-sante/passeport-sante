import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser, AuthUser } from "../auth/decorators/current-user.decorator";
import { StatsService } from "./stats.service";
import { StatsQueryDto } from "./dto/stats-query.dto";

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("stats")
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  // Statistiques filtrées (année, niveau, classe ; département et établissement
  // pour admin/collaborateur). Un compte établissement ne voit que le sien.
  @Get()
  getStats(@Query() query: StatsQueryDto, @CurrentUser() user: AuthUser) {
    return this.statsService.getStats(user, query);
  }
}
