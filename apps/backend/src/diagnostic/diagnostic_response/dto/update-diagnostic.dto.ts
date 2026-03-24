import { PartialType } from "@nestjs/swagger";
import { CreateDiagnosticResponseDto } from "./create-diagnostic.dto";

export class UpdateDiagnosticResponseDto extends PartialType(CreateDiagnosticResponseDto) {}
