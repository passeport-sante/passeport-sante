import { PartialType } from "@nestjs/swagger";
import { CreateStatisticsDataDto } from "./create-datum.dto";

export class UpdateStatisticsDataDto extends PartialType(CreateStatisticsDataDto) {}
