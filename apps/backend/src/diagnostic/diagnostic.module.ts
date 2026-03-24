import { Module } from '@nestjs/common';
import { DiagnosticService } from './diagnostic.service';
import { DiagnosticController } from './diagnostic.controller';
import { DiagnosticSessionController } from './diagnostic_session/diagnostic-session.controller';
import { DiagnosticSessionService } from './diagnostic_session/diagnostic-session.services';
import { DiagnosticQuestionController } from './diagnostic_question/diagnostic-question.controller';
import { DiagnosticQuestionService } from './diagnostic_question/diagnostic-question.services';
import { DiagnosticResponseController } from './diagnostic_response/diagnostic-response.controller';
import { DiagnosticResponseService } from './diagnostic_response/diagnostic-response.services';

@Module({
  controllers: [
    DiagnosticController,
    DiagnosticSessionController,
    DiagnosticQuestionController,
    DiagnosticResponseController,
  ],
  providers: [
    DiagnosticService,
    DiagnosticSessionService,
    DiagnosticQuestionService,
    DiagnosticResponseService,
  ],
})
export class DiagnosticModule {}
