import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from "@nestjs/common";
import { GameDataService } from "./game-data.services";
import { CreateGameDataDto } from "./dto/create-datum.dto";
import { UpdateGameDataDto } from "./dto/update-datum.dto";
import { ApiBearerAuth } from "@nestjs/swagger";

@ApiBearerAuth()
@Controller("data/game")
export class GameDataController {
  constructor(private readonly gameDataService: GameDataService) {}

  @Post()
  create(@Body() dto: CreateGameDataDto) {
    return this.gameDataService.create(dto);
  }

  @Get()
  findAll() {
    return this.gameDataService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.gameDataService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateGameDataDto) {
    return this.gameDataService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.gameDataService.remove(id);
  }
}
