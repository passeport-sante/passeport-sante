import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DiagnosticService } from './diagnostic.service';
import { CreateDiagnosticDto } from './dto/create-diagnostic.dto';
import { UpdateDiagnosticDto } from './dto/update-diagnostic.dto';

@Controller('diagnostic')
export class DiagnosticController {
  constructor(private readonly diagnosticService: DiagnosticService) {}

  @Post()
  create(@Body() createDiagnosticDto: CreateDiagnosticDto) {
    return this.diagnosticService.create(createDiagnosticDto);
  }

  @Get()
  findAll() {
    return this.diagnosticService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.diagnosticService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDiagnosticDto: UpdateDiagnosticDto) {
    return this.diagnosticService.update(+id, updateDiagnosticDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.diagnosticService.remove(+id);
  }
}
