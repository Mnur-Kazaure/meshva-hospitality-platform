export interface GuestSessionProfileDto {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
}

export interface GuestSessionDto {
  guest: GuestSessionProfileDto;
  permissions: string[];
}
