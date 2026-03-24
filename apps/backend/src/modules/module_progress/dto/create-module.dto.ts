import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateModuleProgressDto {
  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  score?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  completion?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isCompleted?: boolean;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  guestStudentId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  moduleId!: string;
}
