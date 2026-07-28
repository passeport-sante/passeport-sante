import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsHexColor, IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";

export class CreateCategoryDto {
  @ApiProperty({ description: "Nom affiché de la catégorie" })
  @IsString()
  @IsNotEmpty()
  name!: string;

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
