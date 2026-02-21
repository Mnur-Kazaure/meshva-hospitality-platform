import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { InventoryModule } from '../inventory/inventory.module';
import { ReservationsModule } from '../reservations/reservations.module';
import { GuestBookingsController } from './guest-bookings.controller';
import { GuestPortalService } from './guest-portal.service';
import { PublicGuestController } from './public-guest.controller';

@Module({
  imports: [AuditModule, InventoryModule, ReservationsModule],
  controllers: [PublicGuestController, GuestBookingsController],
  providers: [GuestPortalService],
})
export class GuestPortalModule {}
