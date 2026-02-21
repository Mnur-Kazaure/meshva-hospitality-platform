export interface CreateStaffDto {
  fullName: string;
  phone: string;
  email?: string;
  roleIds: string[];
  propertyAccessIds: string[];
}
