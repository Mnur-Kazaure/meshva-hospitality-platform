export interface CreateMenuItemDto {
  categoryId: string;
  name: string;
  price: number;
  active?: boolean;
  description?: string;
}
