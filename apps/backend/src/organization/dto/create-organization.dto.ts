import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional, Matches } from "class-validator";

export class CreateOrganizationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  logo?: string;

  // Ville et code postal : obligatoires pour un nouvel établissement, ils
  // servent aux statistiques par département (déduit du code postal).
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiProperty({ example: "54000" })
  @Matches(/^\d{5}$/, { message: "Le code postal doit contenir 5 chiffres" })
  postalCode!: string;

  // Présent quand l'établissement a été choisi dans l'annuaire de l'Éducation nationale.
  @ApiPropertyOptional({ example: "0541569M" })
  @IsOptional()
  @Matches(/^\d{7}[A-Z]$/, { message: "Numéro UAI invalide" })
  uai?: string | null;
}
