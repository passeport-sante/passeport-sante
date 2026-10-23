import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from "@nestjs/common";
import { ModuleProgressService } from "./module-progress.services";
import { CreateModuleProgressDto } from "./dto/create-module.dto";
import { UpdateModuleProgressDto } from "./dto/update-module.dto";
import { ApiBearerAuth } from "@nestjs/swagger";
import { CompleteStepDto, ProgressStateQueryDto } from "./dto/progress-state.dto";

@ApiBearerAuth()
@Controller("modules/progress")
export class ModuleProgressController {
  constructor(private readonly moduleProgressService: ModuleProgressService) {}

  // ─── Parcours élève (public, comme l'envoi des réponses) ──────────────────

  @Get("state")
  getState(@Query() query: ProgressStateQueryDto) {
    return this.moduleProgressService.getState(query.guestStudentId, query.moduleId);
  }

  @Post("step")
  completeStep(@Body() dto: CompleteStepDto) {
    return this.moduleProgressService.completeStep(dto.guestStudentId, dto.stepId);
  }

  @Post()
  create(@Body() dto: CreateModuleProgressDto) {
    return this.moduleProgressService.create(dto);
  }

  @Get()
  findAll() {
    return this.moduleProgressService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.moduleProgressService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateModuleProgressDto) {
    return this.moduleProgressService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.moduleProgressService.remove(id);
  }
}
