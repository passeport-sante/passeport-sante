import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString } from "class-validator";
import { ClassLevel } from "@prisma/client";

// Valeur spéciale du filtre niveau : sessions sans niveau (anciennes sessions).
export const NO_LEVEL = "NONE";

export class StatsQueryDto {
  @ApiPropertyOptional({ example: "2026-2027" })
  @IsOptional()
  @IsString()
  schoolYear?: string;

  @ApiPropertyOptional({ enum: [...Object.values(ClassLevel), NO_LEVEL] })
  @IsOptional()
  @IsIn([...Object.values(ClassLevel), NO_LEVEL])
  level?: ClassLevel | typeof NO_LEVEL;

  @ApiPropertyOptional({ example: "6e B" })
  @IsOptional()
  @IsString()
  className?: string;

  // Filtres réservés aux comptes qui voient tous les établissements.
  @ApiPropertyOptional({ example: "54" })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  organizationId?: string;
}
