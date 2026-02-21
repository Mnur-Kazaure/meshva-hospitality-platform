export interface CreateInitialOwnerDto {
  fullName: string;
  email: string;
  phone: string;
}

export interface CreateTenantDto {
  name: string;
  contactEmail: string;
  contactPhone: string;
  country: string;
  state: string;
  timezone: string;
  subscriptionPlanId: string;
  initialPropertyName: string;
  initialOwner: CreateInitialOwnerDto;
  city?: string;
}
