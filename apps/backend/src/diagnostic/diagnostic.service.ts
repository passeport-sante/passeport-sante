import { Injectable } from '@nestjs/common';
import { CreateDiagnosticDto } from './dto/create-diagnostic.dto';
import { UpdateDiagnosticDto } from './dto/update-diagnostic.dto';

@Injectable()
export class DiagnosticService {
  create(createDiagnosticDto: CreateDiagnosticDto) {
    return 'This action adds a new diagnostic';
  }

  findAll() {
    return `This action returns all diagnostic`;
  }

  findOne(id: number) {
    return `This action returns a #${id} diagnostic`;
  }

  update(id: number, updateDiagnosticDto: UpdateDiagnosticDto) {
    return `This action updates a #${id} diagnostic`;
  }

  remove(id: number) {
    return `This action removes a #${id} diagnostic`;
  }
}
