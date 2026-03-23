import { Test, TestingModule } from '@nestjs/testing';
import { GuestStudendService } from './guest-studend.service';

describe('GuestStudendService', () => {
  let service: GuestStudendService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuestStudendService],
    }).compile();

    service = module.get<GuestStudendService>(GuestStudendService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
