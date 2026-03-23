import { ApiProperty } from "@nestjs/swagger";
import { GameType } from "@prisma/client";

export class Step {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: GameType })
  gameType!: GameType;

  @ApiProperty()
  order!: number;

  @ApiProperty({ required: false })
  mascotteImage?: string;

  @ApiProperty({ required: false })
  content?: object;

  @ApiProperty()
  moduleId!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
