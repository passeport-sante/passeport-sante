import { PartialType } from "@nestjs/swagger";
import { CreateModuleProgressDto } from "./create-module.dto";

export class UpdateModuleProgressDto extends PartialType(CreateModuleProgressDto) {}
