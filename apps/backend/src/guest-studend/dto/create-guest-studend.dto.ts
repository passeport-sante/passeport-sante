import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateGuestStudendDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  age?: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sessionId!: string;
}
