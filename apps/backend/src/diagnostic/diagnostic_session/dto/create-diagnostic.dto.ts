import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateDiagnosticSessionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  className!: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  createdByUserId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  organizationId!: string;
}
