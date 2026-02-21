import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { HousekeepingPermissions, ManagerPermissions } from '@meshva/contracts';
import { IdempotentOperation } from '../../common/decorators/idempotent.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AppRequest } from '../../common/types/request-context';
import { AssignTaskDto } from './dto/assign-task.dto';
import { ListHousekeepingTasksDto } from './dto/list-housekeeping-tasks.dto';
import { HousekeepingService } from './housekeeping.service';

@Controller('properties/:propertyId/housekeeping')
export class HousekeepingController {
  constructor(private readonly housekeepingService: HousekeepingService) {}

  @Get('tasks')
  @RequirePermissions(HousekeepingPermissions.TASK_VIEW)
  listTasks(
    @Param('propertyId') propertyId: string,
    @Req() request: AppRequest,
    @Query() query: ListHousekeepingTasksDto,
  ) {
    return this.housekeepingService.listTasks(propertyId, request, query);
  }

  @Get('rooms/status-board')
  @RequirePermissions(HousekeepingPermissions.TASK_VIEW)
  roomStatusBoard(@Param('propertyId') propertyId: string, @Req() request: AppRequest) {
    return this.housekeepingService.getRoomStatusBoard(propertyId, request);
  }

  @Post('tasks/:taskId/start')
  @RequirePermissions(HousekeepingPermissions.TASK_UPDATE)
  @IdempotentOperation()
  startTask(
    @Param('propertyId') propertyId: string,
    @Param('taskId') taskId: string,
    @Req() request: AppRequest,
  ) {
    return this.housekeepingService.startTask(propertyId, request, taskId);
  }

  @Post('tasks/:taskId/mark-clean')
  @RequirePermissions(HousekeepingPermissions.TASK_UPDATE)
  @IdempotentOperation()
  markClean(
    @Param('propertyId') propertyId: string,
    @Param('taskId') taskId: string,
    @Req() request: AppRequest,
  ) {
    return this.housekeepingService.markClean(propertyId, request, taskId);
  }

  @Post('tasks/:taskId/mark-ready')
  @RequirePermissions(HousekeepingPermissions.TASK_UPDATE)
  @IdempotentOperation()
  markReady(
    @Param('propertyId') propertyId: string,
    @Param('taskId') taskId: string,
    @Req() request: AppRequest,
  ) {
    return this.housekeepingService.markReady(propertyId, request, taskId);
  }

  @Post('tasks/:taskId/assign')
  @RequirePermissions(ManagerPermissions.HOUSEKEEPING_ASSIGN)
  @IdempotentOperation()
  assignTask(
    @Param('propertyId') propertyId: string,
    @Param('taskId') taskId: string,
    @Req() request: AppRequest,
    @Body() dto: AssignTaskDto,
  ) {
    return this.housekeepingService.assignTask(propertyId, request, taskId, dto);
  }
}
