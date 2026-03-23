import { ApiProperty } from "@nestjs/swagger";

export class Organization {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  logo?: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
