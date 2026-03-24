import { PartialType } from "@nestjs/swagger";
import { CreateDiagnosticSessionDto } from "./create-diagnostic.dto";

export class UpdateDiagnosticSessionDto extends PartialType(CreateDiagnosticSessionDto) {}
