import { PartialType } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { CreateDiagnosticSessionDto } from "./create-diagnostic.dto";

export class UpdateDiagnosticSessionDto extends PartialType(CreateDiagnosticSessionDto) {
  // Déclarés explicitement (le service les retire pour empêcher tout rattachement
  // à un autre établissement) — nécessaire car PartialType n'expose pas toujours
  // les champs hérités selon la version de @nestjs/swagger.
  @IsOptional()
  @IsString()
  organizationId?: string;

  @IsOptional()
  @IsString()
  createdByUserId?: string;
}
