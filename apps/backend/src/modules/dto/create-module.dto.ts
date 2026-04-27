import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Min } from "class-validator";

export class CreateModuleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: "Slug unique (ex: vaccination, bien-manger)" })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: "Le slug doit être en kebab-case" })
  slug!: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @IsOptional()
  duration?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: "Nom du fichier mascotte (ex: Mme-etoile.png)" })
  @IsString()
  @IsOptional()
  mascotte?: string;

  @ApiPropertyOptional({ description: "Couleur principale (hex, ex: #FFFBEB)" })
  @IsString()
  @IsOptional()
  colorPrimary?: string;

  @ApiPropertyOptional({ description: "Couleur secondaire / cercle déco (hex, ex: #FDE68A)" })
  @IsString()
  @IsOptional()
  colorSecondary?: string;

  @ApiPropertyOptional({ description: "Couleur de fond de la card" })
  @IsString()
  @IsOptional()
  colorCard?: string;

  @ApiPropertyOptional({ description: "Couleur secondaire de la card" })
  @IsString()
  @IsOptional()
  colorCardSecondary?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  organizationId!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  categoryId?: string;
}
