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
import { GameType } from "@prisma/client";
import { GameDataInputDto } from "./game-data.dto";

export class CreateStepDto {
  @ApiProperty({ enum: GameType })
  @IsEnum(GameType)
  @IsNotEmpty()
  gameType!: GameType;

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
