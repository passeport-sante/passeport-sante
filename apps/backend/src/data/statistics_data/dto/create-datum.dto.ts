import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateStatisticsDataDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  className!: string;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  totalAttempts?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  avgScore?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  ageRange?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  moduleId!: string;
}
