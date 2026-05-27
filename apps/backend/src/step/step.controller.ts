import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from "@nestjs/common";
import { StepService } from "./step.service";
import { CreateStepDto } from "./dto/create-step.dto";
import { UpdateStepDto } from "./dto/update-step.dto";
import { ReorderStepsDto } from "./dto/reorder-steps.dto";
import { ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiBearerAuth()
@Controller("step")
export class StepController {
  constructor(private readonly stepService: StepService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Post()
  create(@Body() createStepDto: CreateStepDto) {
    return this.stepService.create(createStepDto);
  }

  // ⚠️ Déclaré AVANT @Patch(':id') pour ne pas être capturé par la route paramétrée
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Patch("reorder")
  reorder(@Body() dto: ReorderStepsDto) {
    return this.stepService.reorder(dto);
  }

  @Get()
  findAll() {
    return this.stepService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.stepService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Patch(":id")
  update(@Param("id") id: string, @Body() updateStepDto: UpdateStepDto) {
    return this.stepService.update(id, updateStepDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.stepService.remove(id);
  }
}
