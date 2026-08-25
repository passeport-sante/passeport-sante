import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class ListVersionsQueryDto {
  @ApiPropertyOptional({ description: "Nombre de versions à retourner (max 50)" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  take?: number;

  @ApiPropertyOptional({ description: "Id de la dernière version reçue, pour paginer" })
  @IsOptional()
  @IsString()
  cursor?: string;
}
