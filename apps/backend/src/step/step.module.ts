import { Module } from '@nestjs/common';
import { StepService } from './step.service';
import { StepController } from './step.controller';
import { AuthModule } from '../auth/auth.module';
import { ModuleVersionsModule } from '../module-versions/module-versions.module';

@Module({
  imports: [AuthModule, ModuleVersionsModule],
  controllers: [StepController],
  providers: [StepService],
})
export class StepModule {}
