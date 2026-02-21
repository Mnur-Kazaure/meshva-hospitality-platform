import { IsOptional, IsUUID } from 'class-validator';

export class ListMenuItemsDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}

