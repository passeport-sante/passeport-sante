import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from "@nestjs/common";
import { KanbanResponseService } from "./kanban-response.services";
import { CreateKanbanResponseDto } from "./dto/create-response.dto";
import { UpdateKanbanResponseDto } from "./dto/update-response.dto";
import { ApiBearerAuth } from "@nestjs/swagger";

@ApiBearerAuth()
@Controller("response/kanban")
export class KanbanResponseController {
  constructor(private readonly kanbanResponseService: KanbanResponseService) {}

  @Post()
  create(@Body() dto: CreateKanbanResponseDto) {
    return this.kanbanResponseService.create(dto);
  }

  @Get()
  findAll() {
    return this.kanbanResponseService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.kanbanResponseService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateKanbanResponseDto) {
    return this.kanbanResponseService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.kanbanResponseService.remove(id);
  }
}
