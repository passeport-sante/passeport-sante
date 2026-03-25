import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { OrganizationModule } from "./organization/organization.module";
import { UserModule } from "./user/user.module";
import { ModulesModule } from "./modules/modules.module";
import { StepModule } from "./step/step.module";
import { DiagnosticModule } from "./diagnostic/diagnostic.module";
import { ResponseModule } from "./response/response.module";
import { GuestStudendModule } from "./guest-studend/guest-studend.module";
import { DataModule } from "./data/data.module";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),
    AuthModule,
    OrganizationModule,
    UserModule,
    ModulesModule,
    StepModule,
    DiagnosticModule,
    ResponseModule,
    GuestStudendModule,
    DataModule,
    PrismaModule,
  ],
})
export class AppModule {}
