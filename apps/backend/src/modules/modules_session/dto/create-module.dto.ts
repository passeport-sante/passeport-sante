import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ClassLevel } from "@prisma/client";

export class CreateModuleSessionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  className!: string;

  // Obligatoire : sert à filtrer les statistiques par niveau.
  @ApiProperty({ enum: ClassLevel })
  @IsEnum(ClassLevel)
  level!: ClassLevel;

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
