import { PartialType } from "@nestjs/swagger";
import { CreateModuleSessionDto } from "./create-module.dto";

export class UpdateModuleSessionDto extends PartialType(CreateModuleSessionDto) {}
