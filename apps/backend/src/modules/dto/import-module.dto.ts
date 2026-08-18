import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { GameType, StepKind } from "@prisma/client";
import { GameDataInputDto } from "@/step/dto/game-data.dto";

// Une étape dans un import : l'ordre est déduit de la position dans le tableau.
export class ImportStepDto {
  @ApiPropertyOptional({ enum: StepKind, default: StepKind.GAME })
  @IsEnum(StepKind)
  @IsOptional()
  kind?: StepKind;

  @ApiPropertyOptional({ enum: GameType })
  @IsEnum(GameType)
  @IsOptional()
  gameType?: GameType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  mascotteImage?: string;

  @ApiPropertyOptional({ description: "Contenu (titre, consignes, ou sous-étape de contenu)" })
  @IsObject()
  @IsOptional()
  content?: Record<string, any>;

  @ApiPropertyOptional({ type: [GameDataInputDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => GameDataInputDto)
  gameData?: GameDataInputDto[];
}

export class ImportModuleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @IsOptional()
  duration?: number;

  @ApiPropertyOptional({ description: "Nom de la catégorie ; créée automatiquement si absente" })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  mascotte?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  colorPrimary?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  colorSecondary?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  colorCard?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  colorCardSecondary?: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  organizationId!: string;

  @ApiProperty({ type: [ImportStepDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportStepDto)
  steps!: ImportStepDto[];
}
