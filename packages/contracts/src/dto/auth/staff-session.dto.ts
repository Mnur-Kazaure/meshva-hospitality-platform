export interface StaffAccessiblePropertyDto {
  id: string;
  name: string;
}

export interface StaffSessionUserDto {
  id: string;
  fullName: string;
  tenantId: string;
}

export interface StaffSessionDto {
  user: StaffSessionUserDto;
  roles: string[];
  permissions: string[];
  accessibleProperties: StaffAccessiblePropertyDto[];
  requiresPasswordChange: boolean;
}
