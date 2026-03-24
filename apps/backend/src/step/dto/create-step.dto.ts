import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsInt,
  IsObject,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { GameType } from "@prisma/client";

export class CreateStepDto {
  @ApiProperty({ enum: GameType })
  @IsEnum(GameType)
  @IsNotEmpty()
  gameType!: GameType;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  order!: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  mascotteImage?: string;

  @ApiProperty()
  @IsObject()
  @IsOptional()
  content?: Record<string, any>;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  moduleId!: string;
}
