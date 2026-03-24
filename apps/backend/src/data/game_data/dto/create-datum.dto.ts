import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";

export class CreateGameDataDto {
  @ApiProperty()
  @IsObject()
  @IsNotEmpty()
  questionData!: Record<string, any>;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  correctAnswer?: Record<string, any>;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  hints?: Record<string, any>;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  stepId!: string;
}
