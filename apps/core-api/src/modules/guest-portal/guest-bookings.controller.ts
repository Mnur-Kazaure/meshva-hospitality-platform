import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { GuestPermissions } from '@meshva/contracts';
import { IdempotentOperation } from '../../common/decorators/idempotent.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AppRequest } from '../../common/types/request-context';
import { CancelGuestBookingDto } from './dto/cancel-guest-booking.dto';
import { CreateGuestBookingDto } from './dto/create-guest-booking.dto';
import { ModifyGuestBookingDto } from './dto/modify-guest-booking.dto';
import { UpdateGuestProfileDto } from './dto/update-guest-profile.dto';
import { GuestPortalService } from './guest-portal.service';

@Controller('guest')
export class GuestBookingsController {
  constructor(private readonly guestPortalService: GuestPortalService) {}

  @Post('bookings/checkout')
  @RequirePermissions(GuestPermissions.BOOKING_CREATE)
  @IdempotentOperation()
  checkoutBooking(@Req() request: AppRequest, @Body() dto: CreateGuestBookingDto) {
    return this.guestPortalService.createBooking(request, dto);
  }

  @Get('bookings')
  @RequirePermissions(GuestPermissions.BOOKING_VIEW)
  listBookings(@Req() request: AppRequest) {
    return this.guestPortalService.listBookings(request);
  }

  @Get('bookings/:reservationId')
  @RequirePermissions(GuestPermissions.BOOKING_VIEW)
  bookingDetails(@Req() request: AppRequest, @Param('reservationId') reservationId: string) {
    return this.guestPortalService.getBookingDetails(request, reservationId);
  }

  @Post('bookings/:reservationId/modify')
  @RequirePermissions(GuestPermissions.BOOKING_MODIFY)
  @IdempotentOperation()
  modifyBooking(
    @Req() request: AppRequest,
    @Param('reservationId') reservationId: string,
    @Body() dto: ModifyGuestBookingDto,
  ) {
    return this.guestPortalService.modifyBooking(request, reservationId, dto);
  }

  @Post('bookings/:reservationId/cancel')
  @RequirePermissions(GuestPermissions.BOOKING_CANCEL)
  @IdempotentOperation()
  cancelBooking(
    @Req() request: AppRequest,
    @Param('reservationId') reservationId: string,
    @Body() dto: CancelGuestBookingDto,
  ) {
    return this.guestPortalService.cancelBooking(request, reservationId, dto);
  }

  @Get('profile')
  @RequirePermissions(GuestPermissions.BOOKING_VIEW)
  getProfile(@Req() request: AppRequest) {
    return this.guestPortalService.getProfile(request);
  }

  @Patch('profile')
  @RequirePermissions(GuestPermissions.PROFILE_EDIT)
  @IdempotentOperation()
  updateProfile(@Req() request: AppRequest, @Body() dto: UpdateGuestProfileDto) {
    return this.guestPortalService.updateProfile(request, dto);
  }
}
