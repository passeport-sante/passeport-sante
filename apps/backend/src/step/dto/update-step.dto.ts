import { ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { IsArray, IsObject, IsOptional, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { CreateStepDto } from "./create-step.dto";
import { GameDataInputDto } from "./game-data.dto";

// Champs déclarés explicitement (sans `override`) car PartialType n'expose pas
// toujours les champs hérités selon la version de @nestjs/swagger.
export class UpdateStepDto extends PartialType(CreateStepDto) {
  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  content?: Record<string, any>;

  @ApiPropertyOptional({
    type: [GameDataInputDto],
    description: "Si fourni, remplace l'intégralité des gameData de l'étape",
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => GameDataInputDto)
  gameData?: GameDataInputDto[];
}
