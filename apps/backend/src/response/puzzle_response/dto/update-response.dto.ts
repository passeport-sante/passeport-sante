import { PartialType } from "@nestjs/swagger";
import { CreatePuzzleResponseDto } from "./create-response.dto";

export class UpdatePuzzleResponseDto extends PartialType(CreatePuzzleResponseDto) {}
