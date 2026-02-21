import { IsString, Length } from 'class-validator';

export class CreateOwnerNoteDto {
  @IsString()
  @Length(3, 500)
  text!: string;
}
