import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from "@nestjs/common";
import { GuestStudendService } from "./guest-studend.service";
import { CreateGuestStudendDto } from "./dto/create-guest-studend.dto";
import { UpdateGuestStudendDto } from "./dto/update-guest-studend.dto";
import { ApiBearerAuth } from "@nestjs/swagger";

@ApiBearerAuth()
@Controller("guest-studend")
export class GuestStudendController {
  constructor(private readonly guestStudendService: GuestStudendService) {}

  @Post()
  create(@Body() createGuestStudendDto: CreateGuestStudendDto) {
    return this.guestStudendService.create(createGuestStudendDto);
  }

  @Get()
  findAll() {
    return this.guestStudendService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.guestStudendService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateGuestStudendDto: UpdateGuestStudendDto,
  ) {
    return this.guestStudendService.update(id, updateGuestStudendDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.guestStudendService.remove(id);
  }
}
