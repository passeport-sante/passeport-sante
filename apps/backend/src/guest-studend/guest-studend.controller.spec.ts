import { Test, TestingModule } from '@nestjs/testing';
import { GuestStudendController } from './guest-studend.controller';
import { GuestStudendService } from './guest-studend.service';

describe('GuestStudendController', () => {
  let controller: GuestStudendController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GuestStudendController],
      providers: [GuestStudendService],
    }).compile();

    controller = module.get<GuestStudendController>(GuestStudendController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
