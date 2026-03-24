import { PartialType } from "@nestjs/swagger";
import { CreateKanbanResponseDto } from "./create-response.dto";

export class UpdateKanbanResponseDto extends PartialType(CreateKanbanResponseDto) {}
