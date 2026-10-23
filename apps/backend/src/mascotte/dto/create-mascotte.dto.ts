import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from "class-validator";

export class CreateMascotteDto {
  @ApiProperty({ description: "Nom affiché dans le sélecteur du back-office" })
  @IsString()
  @IsNotEmpty()
  label!: string;

  @ApiProperty({
    description:
      "URL Cloudinary du visuel, ou nom de fichier pour les mascottes livrées avec le build",
  })
  @IsString()
  @IsNotEmpty()
  url!: string;

  @ApiPropertyOptional({ description: "Ordre d'affichage dans le sélecteur" })
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}
