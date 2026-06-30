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
import { DiagnosticSessionService } from "./diagnostic-session.services";
import { CreateDiagnosticSessionDto } from "./dto/create-diagnostic.dto";
import { UpdateDiagnosticSessionDto } from "./dto/update-diagnostic.dto";
import { ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { CurrentUser, AuthUser } from "../../auth/decorators/current-user.decorator";

@ApiBearerAuth()
@Controller("diagnostic/session")
export class DiagnosticSessionController {
  constructor(
    private readonly diagnosticSessionService: DiagnosticSessionService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateDiagnosticSessionDto, @CurrentUser() user: AuthUser) {
    return this.diagnosticSessionService.create(dto, user.organizationId, user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.diagnosticSessionService.findAll(user.organizationId);
  }

  // Public : utilisé par les élèves/invités pour rejoindre une session via le code d'accès
  @Get("by-code/:code")
  async findByCode(@Param("code") code: string) {
    const session = await this.diagnosticSessionService.findByAccessCode(code);
    if (!session) throw new NotFoundException("Session introuvable");
    return session;
  }

  @UseGuards(JwtAuthGuard)
  @Get(":id")
  async findOne(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    const session = await this.diagnosticSessionService.findOne(id, user.organizationId);
    if (!session) throw new NotFoundException("Session introuvable");
    return session;
  }

  @UseGuards(JwtAuthGuard)
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateDiagnosticSessionDto, @CurrentUser() user: AuthUser) {
    return this.diagnosticSessionService.update(id, user.organizationId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  remove(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.diagnosticSessionService.remove(id, user.organizationId);
  }
}
