import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateModuleDto {
  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  duration?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  organizationId!: string;
}
