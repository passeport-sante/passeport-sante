import { ApiProperty } from "@nestjs/swagger";

export class KanbanResponse {
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
  stepId!: string;

  @ApiProperty()
  moduleId!: string;

  @ApiProperty()
  createdAt!: Date;
}

export class QuizResponse {
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
  stepId!: string;

  @ApiProperty()
  moduleId!: string;

  @ApiProperty()
  createdAt!: Date;
}

export class PuzzleResponse {
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
  stepId!: string;

  @ApiProperty()
  moduleId!: string;

  @ApiProperty()
  createdAt!: Date;
}
