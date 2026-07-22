import { Module } from "@nestjs/common";
import { MascotteService } from "./mascotte.service";
import { MascotteController } from "./mascotte.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [MascotteController],
  providers: [MascotteService],
})
export class MascotteModule {}
