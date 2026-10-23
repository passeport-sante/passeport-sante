import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";

export class UpdateDiagnosticStudentDto {
  @ApiProperty({ description: "true : retiré des compteurs et des stats de la session" })
  @IsBoolean()
  excluded!: boolean;
}
