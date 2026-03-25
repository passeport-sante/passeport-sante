import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from "@nestjs/common";
import { DiagnosticQuestionService } from "./diagnostic-question.services";
import { CreateDiagnosticQuestionDto } from "./dto/create-diagnostic.dto";
import { UpdateDiagnosticQuestionDto } from "./dto/update-diagnostic.dto";
import { ApiBearerAuth } from "@nestjs/swagger";

@ApiBearerAuth()
@Controller("diagnostic/question")
export class DiagnosticQuestionController {
  constructor(
    private readonly diagnosticQuestionService: DiagnosticQuestionService,
  ) {}

  @Post()
  create(@Body() dto: CreateDiagnosticQuestionDto) {
    return this.diagnosticQuestionService.create(dto);
  }

  @Get()
  findAll() {
    return this.diagnosticQuestionService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.diagnosticQuestionService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateDiagnosticQuestionDto) {
    return this.diagnosticQuestionService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.diagnosticQuestionService.remove(id);
  }
}
