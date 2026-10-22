import { PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { CreateOrganizationDto } from './create-organization.dto';

export class UpdateOrganizationDto extends PartialType(CreateOrganizationDto) {
  // Déclarés explicitement (utilisés par le service) — nécessaire car PartialType
  // n'expose pas toujours les champs hérités selon la version de @nestjs/swagger.
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  city?: string;

  @IsOptional()
  @Matches(/^\d{5}$/, { message: 'Le code postal doit contenir 5 chiffres' })
  postalCode?: string;

  @IsOptional()
  @Matches(/^\d{7}[A-Z]$/, { message: 'Numéro UAI invalide' })
  uai?: string;
}
