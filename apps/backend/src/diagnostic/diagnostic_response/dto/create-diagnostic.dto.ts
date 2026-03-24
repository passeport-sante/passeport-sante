import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";

export class CreateDiagnosticResponseDto {
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
  sessionId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  questionId!: string;
}
