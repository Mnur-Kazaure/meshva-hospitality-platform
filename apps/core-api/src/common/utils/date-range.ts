import { BadRequestException } from '@nestjs/common';

export interface DateRange {
  checkIn: string;
  checkOut: string;
}

export function assertValidDateRange(checkIn: string, checkOut: string): void {
  const start = new Date(checkIn);
  const end = new Date(checkOut);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new BadRequestException('Dates must be valid ISO date strings');
  }

  if (start >= end) {
    throw new BadRequestException('checkOut must be greater than checkIn');
  }
}

export function overlaps(a: DateRange, b: DateRange): boolean {
  return new Date(a.checkIn) < new Date(b.checkOut) && new Date(b.checkIn) < new Date(a.checkOut);
}
