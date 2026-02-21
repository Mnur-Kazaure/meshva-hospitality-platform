import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { OwnerPermissions } from '@meshva/contracts';
import { IdempotentOperation } from '../../common/decorators/idempotent.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AppRequest } from '../../common/types/request-context';
import { CreateOwnerExportJobDto } from './dto/create-owner-export-job.dto';
import { OwnerService } from './owner.service';

@Controller('owner/exports')
export class OwnerExportsController {
  constructor(private readonly ownerService: OwnerService) {}

  @Post()
  @RequirePermissions(OwnerPermissions.EXPORT)
  @IdempotentOperation()
  create(@Req() request: AppRequest, @Body() dto: CreateOwnerExportJobDto) {
    return this.ownerService.createExportJob(request, dto);
  }

  @Get(':exportId')
  @RequirePermissions(OwnerPermissions.EXPORT)
  get(@Req() request: AppRequest, @Param('exportId') exportId: string) {
    return this.ownerService.getExportJob(request, exportId);
  }
}
