import { ApiProperty } from "@nestjs/swagger";

export class DiagnosticSession {
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
  createdByUserId!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class DiagnosticQuestion {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  questionText!: string;

  @ApiProperty()
  questionType!: string;

  @ApiProperty({ required: false })
  options?: object;

  @ApiProperty({ required: false })
  correctAnswer?: object;

  @ApiProperty()
  order!: number;
}

export class DiagnosticResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userAnswer!: object;

  @ApiProperty({ required: false })
  isCorrect?: boolean;

  @ApiProperty({ required: false })
  timing?: number;

  @ApiProperty()
  guestStudentId!: string;

  @ApiProperty()
  sessionId!: string;

  @ApiProperty()
  questionId!: string;

  @ApiProperty()
  createdAt!: Date;
}
