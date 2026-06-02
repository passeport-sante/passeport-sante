import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsObject, IsOptional } from "class-validator";

export class GameDataInputDto {
  @ApiProperty({ description: "Données de la question (forme variable selon le GameType)" })
  @IsObject()
  questionData!: Record<string, any>;

  @ApiPropertyOptional({ description: "Réponse(s) correcte(s)" })
  @IsObject()
  @IsOptional()
  correctAnswer?: Record<string, any>;

  @ApiPropertyOptional({ description: "Indices / hints" })
  @IsObject()
  @IsOptional()
  hints?: Record<string, any>;
}
