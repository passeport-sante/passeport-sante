import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from "@nestjs/common";
import { DiagnosticResponseService } from "./diagnostic-response.services";
import { CreateDiagnosticResponseDto } from "./dto/create-diagnostic.dto";
import { UpdateDiagnosticResponseDto } from "./dto/update-diagnostic.dto";
import { ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";

@ApiBearerAuth()
@Controller("diagnostic/response")
export class DiagnosticResponseController {
  constructor(
    private readonly diagnosticResponseService: DiagnosticResponseService,
  ) {}

  // Public : l'élève envoie sa réponse.
  @Post()
  create(@Body() dto: CreateDiagnosticResponseDto) {
    return this.diagnosticResponseService.create(dto);
  }

  // Réponses de tous les établissements : réservé aux admins. Les enseignants
  // lisent les réponses via le détail de leur session.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Get()
  findAll() {
    return this.diagnosticResponseService.findAll();
  }

  // Public : questions déjà répondues par l'élève, pour reprendre où il en était.
  @Get("progress/:sessionId/:guestStudentId")
  progress(
    @Param("sessionId") sessionId: string,
    @Param("guestStudentId") guestStudentId: string,
  ) {
    return this.diagnosticResponseService.progress(guestStudentId, sessionId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.diagnosticResponseService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateDiagnosticResponseDto) {
    return this.diagnosticResponseService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.diagnosticResponseService.remove(id);
  }
}
