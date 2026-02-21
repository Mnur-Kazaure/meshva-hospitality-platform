import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ManagerPermissions } from '@meshva/contracts';
import { IdempotentOperation } from '../../common/decorators/idempotent.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AppRequest } from '../../common/types/request-context';
import { AuthService } from './auth.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { DeactivateStaffDto } from './dto/deactivate-staff.dto';
import { ListStaffDto } from './dto/list-staff.dto';
import { SoftDeleteStaffDto } from './dto/soft-delete-staff.dto';
import { StaffResetPasswordDto } from './dto/staff-reset-password.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

@Controller('properties/:propertyId/staff')
export class StaffManagementController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  @RequirePermissions(ManagerPermissions.STAFF_VIEW)
  list(
    @Param('propertyId') propertyId: string,
    @Req() request: AppRequest,
    @Query() query: ListStaffDto,
  ) {
    return this.authService.listStaff(propertyId, request, query);
  }

  @Post()
  @RequirePermissions(ManagerPermissions.STAFF_CREATE)
  @IdempotentOperation()
  create(
    @Param('propertyId') propertyId: string,
    @Req() request: AppRequest,
    @Body() dto: CreateStaffDto,
  ) {
    return this.authService.createStaff(propertyId, request, dto);
  }

  @Patch(':userId')
  @RequirePermissions(ManagerPermissions.STAFF_UPDATE)
  @IdempotentOperation()
  update(
    @Param('propertyId') propertyId: string,
    @Param('userId') userId: string,
    @Req() request: AppRequest,
    @Body() dto: UpdateStaffDto,
  ) {
    return this.authService.updateStaff(propertyId, userId, request, dto);
  }

  @Post(':userId/deactivate')
  @RequirePermissions(ManagerPermissions.STAFF_DEACTIVATE)
  @IdempotentOperation()
  deactivate(
    @Param('propertyId') propertyId: string,
    @Param('userId') userId: string,
    @Req() request: AppRequest,
    @Body() dto: DeactivateStaffDto,
  ) {
    return this.authService.deactivateStaff(propertyId, userId, request, dto);
  }

  @Post(':userId/activate')
  @RequirePermissions(ManagerPermissions.STAFF_ACTIVATE)
  @IdempotentOperation()
  activate(
    @Param('propertyId') propertyId: string,
    @Param('userId') userId: string,
    @Req() request: AppRequest,
  ) {
    return this.authService.activateStaff(propertyId, userId, request);
  }

  @Post(':userId/reset-invite')
  @RequirePermissions(ManagerPermissions.STAFF_RESET_PASSWORD)
  @IdempotentOperation()
  resetInvite(
    @Param('propertyId') propertyId: string,
    @Param('userId') userId: string,
    @Req() request: AppRequest,
    @Body() dto: StaffResetPasswordDto,
  ) {
    return this.authService.resetStaffPassword(propertyId, userId, request, dto);
  }

  @Post(':userId/soft-delete')
  @RequirePermissions(ManagerPermissions.STAFF_DELETE)
  @IdempotentOperation()
  softDelete(
    @Param('propertyId') propertyId: string,
    @Param('userId') userId: string,
    @Req() request: AppRequest,
    @Body() dto: SoftDeleteStaffDto,
  ) {
    return this.authService.softDeleteStaff(propertyId, userId, request, dto);
  }
}
