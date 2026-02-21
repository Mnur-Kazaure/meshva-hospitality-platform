import { IsOptional, IsString, Length } from 'class-validator';

export class SearchGuestsDto {
  @IsOptional()
  @IsString()
  @Length(0, 100)
  query?: string;
}
