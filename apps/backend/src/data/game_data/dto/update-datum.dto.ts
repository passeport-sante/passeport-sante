import { PartialType } from "@nestjs/swagger";
import { CreateGameDataDto } from "./create-datum.dto";

export class UpdateGameDataDto extends PartialType(CreateGameDataDto) {}
