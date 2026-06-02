import { Module } from '@nestjs/common';
import { ModulesService } from './modules.service';
import { ModulesController } from './modules.controller';
import { ModuleSessionController } from './modules_session/module-session.controller';
import { ModuleSessionService } from './modules_session/module-session.services';
import { ModuleProgressController } from './module_progress/module-progress.controller';
import { ModuleProgressService } from './module_progress/module-progress.services';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [
    ModulesController,
    ModuleSessionController,
    ModuleProgressController,
  ],
  providers: [
    ModulesService,
    ModuleSessionService,
    ModuleProgressService,
  ],
})
export class ModulesModule {}
