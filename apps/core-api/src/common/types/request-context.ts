import { Request } from 'express';

export interface RequestContext {
  tenantId: string;
  userId: string;
  requestId?: string;
  role?: string;
  permissions: string[];
  propertyId?: string;
  ipAddress?: string;
  userAgent?: string;
  identityType?: 'staff' | 'guest' | 'header';
  sessionId?: string;
  guestEmail?: string;
  guestPhone?: string;
}

export interface AppRequest extends Request {
  requestId?: string;
  context: RequestContext;
}
