import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsInt, IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";
import { QuestionType } from "@prisma/client";

export class CreateDiagnosticQuestionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  questionText!: string;

  @ApiProperty({ enum: QuestionType })
  @IsEnum(QuestionType)
  questionType!: QuestionType;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  options?: Record<string, any>;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  correctAnswer?: Record<string, any>;

  @ApiProperty()
  @IsInt()
  order!: number;
}
