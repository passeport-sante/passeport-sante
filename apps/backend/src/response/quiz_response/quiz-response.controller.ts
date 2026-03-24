import { Controller, Get, Post, Body, Patch, Param, Delete } from "@nestjs/common";
import { QuizResponseService } from "./quiz-response.services";
import { CreateQuizResponseDto } from "./dto/create-response.dto";
import { UpdateQuizResponseDto } from "./dto/update-response.dto";

@Controller("response/quiz")
export class QuizResponseController {
  constructor(private readonly quizResponseService: QuizResponseService) {}

  @Post()
  create(@Body() dto: CreateQuizResponseDto) {
    return this.quizResponseService.create(dto);
  }

  @Get()
  findAll() {
    return this.quizResponseService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.quizResponseService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateQuizResponseDto) {
    return this.quizResponseService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.quizResponseService.remove(id);
  }
}
