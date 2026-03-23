import { Module } from '@nestjs/common';
import { GuestStudendService } from './guest-studend.service';
import { GuestStudendController } from './guest-studend.controller';

@Module({
  controllers: [GuestStudendController],
  providers: [GuestStudendService],
})
export class GuestStudendModule {}
