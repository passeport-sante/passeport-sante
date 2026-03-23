import { ApiProperty } from "@nestjs/swagger";

export class Module {
  @ApiProperty()
  id!: string;

  @ApiProperty({ required: false })
  duration?: number;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty()
  organizationId!: string;
}
