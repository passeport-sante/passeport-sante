import { Module } from "@nestjs/common";
import { ModuleVersionsService } from "./module-versions.service";
import { ModuleVersionsController } from "./module-versions.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [ModuleVersionsController],
  providers: [ModuleVersionsService],
  exports: [ModuleVersionsService],
})
export class ModuleVersionsModule {}
