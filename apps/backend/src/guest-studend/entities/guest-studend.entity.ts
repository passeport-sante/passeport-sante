import { ApiProperty } from "@nestjs/swagger";

export class GuestStudent {
  @ApiProperty()
  id!: string;

  @ApiProperty({ required: false })
  gender?: string;

  @ApiProperty({ required: false })
  age?: number;

  @ApiProperty()
  sessionId!: string;
}
