import { Test, TestingModule } from '@nestjs/testing';
import { DiagnosticController } from './diagnostic.controller';
import { DiagnosticService } from './diagnostic.service';

describe('DiagnosticController', () => {
  let controller: DiagnosticController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DiagnosticController],
      providers: [DiagnosticService],
    }).compile();

    controller = module.get<DiagnosticController>(DiagnosticController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
