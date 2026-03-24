import { PartialType } from "@nestjs/swagger";
import { CreateQuizResponseDto } from "./create-response.dto";

export class UpdateQuizResponseDto extends PartialType(CreateQuizResponseDto) {}
