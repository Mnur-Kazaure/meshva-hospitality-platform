import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { OwnerPermissions } from '@meshva/contracts';
import { IdempotentOperation } from '../../common/decorators/idempotent.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AppRequest } from '../../common/types/request-context';
import { CreateOwnerNoteDto } from './dto/create-owner-note.dto';
import { OwnerExceptionsQueryDto } from './dto/owner-exceptions-query.dto';
import { OwnerService } from './owner.service';

@Controller('owner/exceptions')
export class OwnerExceptionsController {
  constructor(private readonly ownerService: OwnerService) {}

  @Get()
  @RequirePermissions(OwnerPermissions.EXCEPTIONS_VIEW)
  list(@Req() request: AppRequest, @Query() query: OwnerExceptionsQueryDto) {
    return this.ownerService.listExceptions(request, query);
  }

  @Post(':exceptionId/ack')
  @RequirePermissions(OwnerPermissions.EXCEPTIONS_VIEW)
  @IdempotentOperation()
  acknowledge(@Req() request: AppRequest, @Param('exceptionId') exceptionId: string) {
    return this.ownerService.acknowledgeException(request, exceptionId);
  }

  @Post(':exceptionId/note')
  @RequirePermissions(OwnerPermissions.NOTE_CREATE)
  @IdempotentOperation()
  note(
    @Req() request: AppRequest,
    @Param('exceptionId') exceptionId: string,
    @Body() dto: CreateOwnerNoteDto,
  ) {
    return this.ownerService.createExceptionNote(request, exceptionId, dto);
  }
}
