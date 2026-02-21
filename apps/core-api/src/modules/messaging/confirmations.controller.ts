import { Body, Controller, Param, Post, Req } from '@nestjs/common';
import { FrontDeskPermissions } from '@meshva/contracts';
import { IdempotentOperation } from '../../common/decorators/idempotent.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AppRequest } from '../../common/types/request-context';
import { SendConfirmationDto } from './dto/send-confirmation.dto';
import { MessagingService } from './messaging.service';

@Controller('properties/:propertyId/confirmations')
export class ConfirmationsController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post('send')
  @RequirePermissions(FrontDeskPermissions.CONFIRMATION_SEND)
  @IdempotentOperation()
  send(
    @Param('propertyId') propertyId: string,
    @Req() request: AppRequest,
    @Body() dto: SendConfirmationDto,
  ) {
    return this.messagingService.send(propertyId, request.context, dto);
  }
}
