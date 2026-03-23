import { PartialType } from '@nestjs/swagger';
import { CreateGuestStudendDto } from './create-guest-studend.dto';

export class UpdateGuestStudendDto extends PartialType(CreateGuestStudendDto) {}
