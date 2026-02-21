import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { AppRequest } from '../../common/types/request-context';
import { PublicSearchDto } from './dto/public-search.dto';
import { GuestPortalService } from './guest-portal.service';

@Controller('public')
export class PublicGuestController {
  constructor(private readonly guestPortalService: GuestPortalService) {}

  @Get('search')
  search(@Req() request: AppRequest, @Query() query: PublicSearchDto) {
    return this.guestPortalService.search(request, query);
  }

  @Get('properties/:propertyId')
  propertyDetails(@Req() request: AppRequest, @Param('propertyId') propertyId: string) {
    return this.guestPortalService.getPropertyDetails(request, propertyId);
  }
}
