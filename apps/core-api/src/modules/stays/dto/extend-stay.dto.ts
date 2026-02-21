import { IsDateString } from 'class-validator';

export class ExtendStayDto {
  @IsDateString()
  newCheckOut!: string;
}
