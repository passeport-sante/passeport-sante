import { PartialType } from "@nestjs/swagger";
import { CreateMascotteDto } from "./create-mascotte.dto";

export class UpdateMascotteDto extends PartialType(CreateMascotteDto) {}
