import { ApiProperty } from "@nestjs/swagger";

export class GameData {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  questionData!: object;

  @ApiProperty({ required: false })
  correctAnswer?: object;

  @ApiProperty({ required: false })
  hints?: object;

  @ApiProperty()
  stepId!: string;
}

export class ModuleProgress {
  @ApiProperty()
  id!: string;

  @ApiProperty({ required: false })
  score?: number;

  @ApiProperty()
  completion!: number;

  @ApiProperty()
  isCompleted!: boolean;

  @ApiProperty()
  guestStudentId!: string;

  @ApiProperty()
  moduleId!: string;
}

export class StatisticsData {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  className!: string;

  @ApiProperty()
  totalAttempts!: number;

  @ApiProperty({ required: false })
  avgScore?: number;

  @ApiProperty({ required: false })
  gender?: string;

  @ApiProperty({ required: false })
  ageRange?: string;

  @ApiProperty()
  moduleId!: string;
}
