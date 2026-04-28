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
import { DiagnosticSessionService } from "./diagnostic-session.services";
import { CreateDiagnosticSessionDto } from "./dto/create-diagnostic.dto";
import { UpdateDiagnosticSessionDto } from "./dto/update-diagnostic.dto";
import { ApiBearerAuth } from "@nestjs/swagger";

@ApiBearerAuth()
@Controller("diagnostic/session")
export class DiagnosticSessionController {
  constructor(
    private readonly diagnosticSessionService: DiagnosticSessionService,
  ) {}

  @Post()
  create(@Body() dto: CreateDiagnosticSessionDto) {
    return this.diagnosticSessionService.create(dto);
  }

  @Get()
  findAll() {
    return this.diagnosticSessionService.findAll();
  }

  @Get("by-code/:code")
  async findByCode(@Param("code") code: string) {
    const session = await this.diagnosticSessionService.findByAccessCode(code);
    if (!session) throw new NotFoundException("Session introuvable");
    return session;
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.diagnosticSessionService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateDiagnosticSessionDto) {
    return this.diagnosticSessionService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.diagnosticSessionService.remove(id);
  }
}
