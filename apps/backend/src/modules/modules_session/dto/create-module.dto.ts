import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateModuleSessionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  className!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  accessCode!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  accessUrl!: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  moduleId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  createdByUserId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  organizationId!: string;
}
