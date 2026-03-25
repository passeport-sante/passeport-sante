import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from "@nestjs/common";
import { PuzzleResponseService } from "./puzzle-response.services";
import { CreatePuzzleResponseDto } from "./dto/create-response.dto";
import { UpdatePuzzleResponseDto } from "./dto/update-response.dto";
import { ApiBearerAuth } from "@nestjs/swagger";

@ApiBearerAuth()
@Controller("response/puzzle")
export class PuzzleResponseController {
  constructor(private readonly puzzleResponseService: PuzzleResponseService) {}

  @Post()
  create(@Body() dto: CreatePuzzleResponseDto) {
    return this.puzzleResponseService.create(dto);
  }

  @Get()
  findAll() {
    return this.puzzleResponseService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.puzzleResponseService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdatePuzzleResponseDto) {
    return this.puzzleResponseService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.puzzleResponseService.remove(id);
  }
}
