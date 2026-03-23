import { Module } from '@nestjs/common';
import { DiagnosticService } from './diagnostic.service';
import { DiagnosticController } from './diagnostic.controller';

@Module({
  controllers: [DiagnosticController],
  providers: [DiagnosticService],
})
export class DiagnosticModule {}
