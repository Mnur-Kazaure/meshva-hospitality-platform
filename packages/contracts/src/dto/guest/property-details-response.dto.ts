export interface PropertyDetailsRoomTypeDto {
  id: string;
  name: string;
  totalUnits: number;
  startingPrice?: number;
}

export interface PropertyDetailsResponseDto {
  property: {
    id: string;
    name: string;
    state: string;
    city: string;
  };
  photos: string[];
  amenities: string[];
  roomTypes: PropertyDetailsRoomTypeDto[];
  policies: {
    checkInTime: string;
    checkOutTime: string;
    cancellation: string;
  };
}
