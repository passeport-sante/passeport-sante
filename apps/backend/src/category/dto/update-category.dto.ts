import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsHexColor, IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";

// Champs déclarés explicitement (plutôt que via PartialType) : le service lit
// dto.name / dto.color / dto.order directement, et le typage de PartialType ne
// les expose pas de façon fiable selon la version de @nestjs/mapped-types.
export class UpdateCategoryDto {
  @ApiPropertyOptional({ description: "Nom affiché de la catégorie" })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: "Couleur d'accent (hex, ex: #2A8970)" })
  @IsHexColor()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ description: "Ordre d'affichage (asc)" })
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}
