import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

// Lecture de l'avancement d'un élève invité sur un module.
export class ProgressStateQueryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  guestStudentId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  moduleId!: string;
}

// Déclaration d'une étape terminée. Le serveur ne croit pas le client sur
// parole : il vérifie qu'une réponse a bien été enregistrée pour cette étape.
export class CompleteStepDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  guestStudentId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  stepId!: string;
}
