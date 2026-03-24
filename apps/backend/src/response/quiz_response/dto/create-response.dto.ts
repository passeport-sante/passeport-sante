import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";

export class CreateQuizResponseDto {
  @ApiProperty()
  @IsObject()
  @IsNotEmpty()
  userAnswer!: Record<string, any>;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isCorrect?: boolean;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  timing?: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  guestStudentId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  stepId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  moduleId!: string;
}
