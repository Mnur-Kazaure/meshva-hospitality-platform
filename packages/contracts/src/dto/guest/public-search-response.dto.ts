export interface PublicSearchRoomTypeDto {
  roomTypeId: string;
  roomTypeName: string;
  availableUnits: number;
  startingPrice?: number;
}

export interface PublicSearchRowDto {
  propertyId: string;
  propertyName: string;
  state: string;
  city: string;
  availableRoomTypes: PublicSearchRoomTypeDto[];
}

export interface PublicSearchResponseDto {
  checkIn: string;
  checkOut: string;
  count: number;
  rows: PublicSearchRowDto[];
}
