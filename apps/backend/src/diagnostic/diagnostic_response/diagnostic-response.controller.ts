import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from "@nestjs/common";
import { DiagnosticResponseService } from "./diagnostic-response.services";
import { CreateDiagnosticResponseDto } from "./dto/create-diagnostic.dto";
import { UpdateDiagnosticResponseDto } from "./dto/update-diagnostic.dto";
import { ApiBearerAuth } from "@nestjs/swagger";

@ApiBearerAuth()
@Controller("diagnostic/response")
export class DiagnosticResponseController {
  constructor(
    private readonly diagnosticResponseService: DiagnosticResponseService,
  ) {}

  @Post()
  create(@Body() dto: CreateDiagnosticResponseDto) {
    return this.diagnosticResponseService.create(dto);
  }

  @Get()
  findAll() {
    return this.diagnosticResponseService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.diagnosticResponseService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateDiagnosticResponseDto) {
    return this.diagnosticResponseService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.diagnosticResponseService.remove(id);
  }
}
