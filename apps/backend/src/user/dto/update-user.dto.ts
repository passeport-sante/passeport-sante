import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

// Champs déclarés explicitement car PartialType n'expose pas toujours les champs
// hérités selon la version de @nestjs/swagger.
export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  password?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isSuspended?: boolean;
}
