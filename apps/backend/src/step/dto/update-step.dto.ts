import { ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { IsArray, IsOptional, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { CreateStepDto } from "./create-step.dto";
import { GameDataInputDto } from "./game-data.dto";

export class UpdateStepDto extends PartialType(CreateStepDto) {
  @ApiPropertyOptional({
    type: [GameDataInputDto],
    description: "Si fourni, remplace l'intégralité des gameData de l'étape",
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => GameDataInputDto)
  override gameData?: GameDataInputDto[];
}
