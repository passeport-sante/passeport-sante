import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsEnum,
  IsInt,
  IsObject,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { GameType, StepKind } from "@prisma/client";
import { GameDataInputDto } from "./game-data.dto";

export class CreateStepDto {
  @ApiPropertyOptional({ enum: StepKind, default: StepKind.GAME })
  @IsEnum(StepKind)
  @IsOptional()
  kind?: StepKind;

  @ApiPropertyOptional({ enum: GameType, description: "Requis pour une étape de jeu (kind=GAME)" })
  @IsEnum(GameType)
  @IsOptional()
  gameType?: GameType;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  order!: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  mascotteImage?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  content?: Record<string, any>;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  moduleId!: string;

  @ApiPropertyOptional({ type: [GameDataInputDto], description: "Données de jeu initiales (optionnel)" })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => GameDataInputDto)
  gameData?: GameDataInputDto[];
}
