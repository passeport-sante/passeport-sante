import { Injectable } from '@nestjs/common';
import { CreateGuestStudendDto } from './dto/create-guest-studend.dto';
import { UpdateGuestStudendDto } from './dto/update-guest-studend.dto';

@Injectable()
export class GuestStudendService {
  create(createGuestStudendDto: CreateGuestStudendDto) {
    return 'This action adds a new guestStudend';
  }

  findAll() {
    return `This action returns all guestStudend`;
  }

  findOne(id: number) {
    return `This action returns a #${id} guestStudend`;
  }

  update(id: number, updateGuestStudendDto: UpdateGuestStudendDto) {
    return `This action updates a #${id} guestStudend`;
  }

  remove(id: number) {
    return `This action removes a #${id} guestStudend`;
  }
}
