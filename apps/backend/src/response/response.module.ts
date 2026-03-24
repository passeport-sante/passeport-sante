import { Module } from '@nestjs/common';
import { ResponseService } from './response.service';
import { ResponseController } from './response.controller';
import { KanbanResponseController } from './kanban_response/kanban-response.controller';
import { KanbanResponseService } from './kanban_response/kanban-response.services';
import { QuizResponseController } from './quiz_response/quiz-response.controller';
import { QuizResponseService } from './quiz_response/quiz-response.services';
import { PuzzleResponseController } from './puzzle_response/puzzle-response.controller';
import { PuzzleResponseService } from './puzzle_response/puzzle-response.services';

@Module({
  controllers: [
    ResponseController,
    KanbanResponseController,
    QuizResponseController,
    PuzzleResponseController,
  ],
  providers: [
    ResponseService,
    KanbanResponseService,
    QuizResponseService,
    PuzzleResponseService,
  ],
})
export class ResponseModule {}
