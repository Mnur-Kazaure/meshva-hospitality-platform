import type { ExceptionSeverity } from '../../enums/exception-severity';
import type { OwnerExceptionType } from '../../enums/owner-exception-type';
import type { OwnerExportFormat } from '../../enums/owner-export-format';
import type { OwnerExportStatus } from '../../enums/owner-export-status';
import type { OwnerExportType } from '../../enums/owner-export-type';

export interface OwnerDateRangeDto {
  from: string;
  to: string;
  days: number;
}

export interface OwnerOverviewPropertyBreakdownDto {
  propertyId: string;
  propertyName: string;
  revenue: number;
  occupancy: number;
  outstandingBalance: number;
  closeCompliance: number;
  exceptionsCount: number;
}

export interface OwnerOverviewResponseDto {
  range: OwnerDateRangeDto;
  totals: {
    revenue: number;
    occupancy: number;
    outstandingBalance: number;
    closeCompliance: number;
    exceptionsCount: number;
  };
  breakdownByProperty: OwnerOverviewPropertyBreakdownDto[];
}

export interface OwnerPropertiesRowDto {
  propertyId: string;
  propertyName: string;
  revenue: number;
  occupancy: number;
  outstandingBalance: number;
  closeCompliance: number;
  exceptionsCount: number;
  lastDailyCloseAt?: string;
  topIssue?: string | null;
}

export interface OwnerPropertiesResponseDto {
  range: OwnerDateRangeDto;
  rows: OwnerPropertiesRowDto[];
}

export interface OwnerFinancialBreakdownPropertyDto {
  propertyId: string;
  propertyName: string;
  revenueByMethod: {
    cash: number;
    transfer: number;
    pos: number;
  };
  netRevenue: number;
  refunds: {
    count: number;
    value: number;
  };
  discounts: {
    count: number;
    value: number;
  };
  outstandingBalance: number;
}

export interface OwnerFinancialSummaryResponseDto {
  range: OwnerDateRangeDto;
  totals: {
    revenueByMethod: {
      cash: number;
      transfer: number;
      pos: number;
    };
    netRevenue: number;
    refunds: {
      count: number;
      value: number;
    };
    discounts: {
      count: number;
      value: number;
    };
    outstandingBalance: number;
  };
  breakdownByProperty: OwnerFinancialBreakdownPropertyDto[];
}

export interface OwnerOperationsPropertyDto {
  propertyId: string;
  propertyName: string;
  arrivals: number;
  departures: number;
  noShows: number;
  dirtyBacklog: {
    rooms: number;
    agingHours: number;
  };
  reservationSources: Record<string, number>;
}

export interface OwnerOperationsSummaryResponseDto {
  range: OwnerDateRangeDto;
  breakdownByProperty: OwnerOperationsPropertyDto[];
  totals: {
    arrivals: number;
    departures: number;
    noShows: number;
    dirtyRooms: number;
  };
}

export interface OwnerExceptionDto {
  id: string;
  tenantId: string;
  propertyId?: string;
  type: OwnerExceptionType;
  severity: ExceptionSeverity;
  sourceAction: string;
  actorUserId?: string;
  entityType: string;
  entityId: string;
  summary: string;
  metadataJson: Record<string, unknown>;
  acknowledgedByUserId?: string;
  acknowledgedAt?: string;
  dedupeKey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OwnerExceptionsResponseDto {
  range: OwnerDateRangeDto;
  exceptions: OwnerExceptionDto[];
}

export interface OwnerAuditLogDto {
  id: string;
  tenantId: string;
  propertyId?: string;
  actorUserId?: string;
  actorRole?: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeJson?: unknown;
  afterJson?: unknown;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface OwnerNoteDto {
  id: string;
  tenantId: string;
  propertyId?: string;
  exceptionId: string;
  text: string;
  createdByUserId: string;
  createdAt: string;
}

export interface OwnerExportJobDto {
  id: string;
  tenantId: string;
  requestedByUserId: string;
  exportType: OwnerExportType;
  format: OwnerExportFormat;
  fromDate: string;
  toDate: string;
  propertyIds: string[];
  filtersJson: Record<string, unknown>;
  status: OwnerExportStatus;
  downloadUrl?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}
