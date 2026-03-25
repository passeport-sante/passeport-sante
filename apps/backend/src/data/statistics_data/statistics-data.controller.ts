import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from "@nestjs/common";
import { StatisticsDataService } from "./statistics-data.services";
import { CreateStatisticsDataDto } from "./dto/create-datum.dto";
import { UpdateStatisticsDataDto } from "./dto/update-datum.dto";
import { ApiBearerAuth } from "@nestjs/swagger";

@ApiBearerAuth()
@Controller("data/statistics")
export class StatisticsDataController {
  constructor(private readonly statisticsDataService: StatisticsDataService) {}

  @Post()
  create(@Body() dto: CreateStatisticsDataDto) {
    return this.statisticsDataService.create(dto);
  }

  @Get()
  findAll() {
    return this.statisticsDataService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.statisticsDataService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateStatisticsDataDto) {
    return this.statisticsDataService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.statisticsDataService.remove(id);
  }
}
