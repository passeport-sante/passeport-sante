import { ApiProperty } from "@nestjs/swagger";

export class ModuleSession {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  className!: string;

  @ApiProperty()
  accessCode!: string;

  @ApiProperty()
  accessUrl!: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty()
  moduleId!: string;

  @ApiProperty()
  createdByUserId!: string;

  @ApiProperty()
  organizationId!: string;
}
