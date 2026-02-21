import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { FrontDeskPermissions } from '@meshva/contracts';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AppRequest } from '../../common/types/request-context';
import { CreateGuestDto } from './dto/create-guest.dto';
import { SearchGuestsDto } from './dto/search-guests.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';
import { GuestsService } from './guests.service';

@Controller('properties/:propertyId/guests')
export class GuestsController {
  constructor(private readonly guestsService: GuestsService) {}

  @Get()
  @RequirePermissions(FrontDeskPermissions.GUEST_VIEW)
  list(
    @Param('propertyId') propertyId: string,
    @Query() query: SearchGuestsDto,
    @Req() request: AppRequest,
  ) {
    return this.guestsService.list(propertyId, request, query.query);
  }

  @Post()
  @RequirePermissions(FrontDeskPermissions.GUEST_CREATE)
  create(
    @Param('propertyId') propertyId: string,
    @Req() request: AppRequest,
    @Body() dto: CreateGuestDto,
  ) {
    return this.guestsService.create(propertyId, request, dto);
  }

  @Patch(':guestId')
  @RequirePermissions(FrontDeskPermissions.GUEST_EDIT)
  update(
    @Param('propertyId') propertyId: string,
    @Param('guestId') guestId: string,
    @Req() request: AppRequest,
    @Body() dto: UpdateGuestDto,
  ) {
    return this.guestsService.update(propertyId, guestId, request, dto);
  }
}
