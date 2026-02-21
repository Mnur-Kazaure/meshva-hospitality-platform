export interface StaffInvitePayloadDto {
  token: string;
  expiresAt: string;
  inviteLink: string;
}

export interface StaffListItemDto {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  status: string;
  mustChangePassword: boolean;
  roles: string[];
  propertyAccessIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StaffListResponseDto {
  count: number;
  rows: StaffListItemDto[];
}

export interface StaffCreateResponseDto {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  status: string;
  mustChangePassword: boolean;
  roleIds: string[];
  propertyAccessIds: string[];
  invite: StaffInvitePayloadDto;
}

export interface StaffUpdateResponseDto {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
  roleIds?: string[];
  propertyAccessIds?: string[];
}

export interface StaffStatusResponseDto {
  id: string;
  status: string;
}

export interface StaffResetInviteResponseDto {
  id: string;
  invite: StaffInvitePayloadDto;
}
