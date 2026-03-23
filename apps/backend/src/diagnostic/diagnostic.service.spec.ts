import { Test, TestingModule } from '@nestjs/testing';
import { DiagnosticService } from './diagnostic.service';

describe('DiagnosticService', () => {
  let service: DiagnosticService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DiagnosticService],
    }).compile();

    service = module.get<DiagnosticService>(DiagnosticService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
