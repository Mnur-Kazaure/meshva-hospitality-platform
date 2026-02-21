import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  HousekeepingEvents,
  HousekeepingTaskStatus,
  MaintenanceSeverity,
  MaintenanceTicketStatus,
  RoomStatus,
} from '@meshva/contracts';
import { randomUUID } from 'crypto';
import { AppRequest } from '../../common/types/request-context';
import { AuditService } from '../audit/audit.service';
import {
  FRONT_DESK_REPOSITORY,
  FrontDeskRepository,
} from '../persistence/repositories/front-desk.repository';
import { AssignTaskDto } from './dto/assign-task.dto';
import { CreateMaintenanceTicketDto } from './dto/create-maintenance-ticket.dto';
import { ListHousekeepingTasksDto } from './dto/list-housekeeping-tasks.dto';
import { ListMaintenanceTicketsDto } from './dto/list-maintenance-tickets.dto';

@Injectable()
export class HousekeepingService {
  constructor(
    @Inject(FRONT_DESK_REPOSITORY)
    private readonly repository: FrontDeskRepository,
    private readonly auditService: AuditService,
  ) {}

  async listTasks(propertyId: string, request: AppRequest, query: ListHousekeepingTasksDto) {
    const tenantId = request.context.tenantId;
    const assignedUserId = query.mine ? request.context.userId : query.assignedUserId;

    const [tasks, rooms, roomTypes] = await Promise.all([
      this.repository.listHousekeepingTasks({
        tenantId,
        propertyId,
        status: query.status,
        assignedUserId,
        roomId: query.roomId,
      }),
      this.repository.listRooms({ tenantId, propertyId }),
      this.repository.listRoomTypes({ tenantId, propertyId }),
    ]);

    const nowMs = Date.now();
    return tasks.map((task) => {
      const room = rooms.find((item) => item.id === task.roomId);
      const roomType = roomTypes.find((item) => item.id === room?.roomTypeId);
      const dirtySinceMinutes = Math.max(
        0,
        Math.floor((nowMs - new Date(task.createdAt).getTime()) / 60000),
      );

      return {
        ...task,
        roomNumber: room?.roomNumber,
        roomStatus: room?.status,
        roomType: roomType?.name,
        dirtySinceMinutes,
      };
    });
  }

  async getRoomStatusBoard(propertyId: string, request: AppRequest) {
    const tenantId = request.context.tenantId;
    const [rooms, roomTypes, activeTasks] = await Promise.all([
      this.repository.listRooms({ tenantId, propertyId }),
      this.repository.listRoomTypes({ tenantId, propertyId }),
      this.repository.listHousekeepingTasks({ tenantId, propertyId }),
    ]);

    const activeStatuses = new Set<HousekeepingTaskStatus>([
      HousekeepingTaskStatus.DIRTY,
      HousekeepingTaskStatus.CLEANING,
      HousekeepingTaskStatus.CLEAN,
    ]);

    return rooms
      .map((room) => {
        const roomType = roomTypes.find((item) => item.id === room.roomTypeId);
        const task = activeTasks.find(
          (item) => item.roomId === room.id && activeStatuses.has(item.status),
        );

        return {
          roomId: room.id,
          roomNumber: room.roomNumber,
          roomType: roomType?.name,
          roomStatus: room.status,
          activeTaskStatus: task?.status,
          assignedUserId: task?.assignedUserId,
          taskId: task?.id,
        };
      })
      .sort((a, b) => a.roomNumber.localeCompare(b.roomNumber));
  }

  async startTask(propertyId: string, request: AppRequest, taskId: string) {
    return this.transitionTask(propertyId, request, taskId, {
      expectedStatus: HousekeepingTaskStatus.DIRTY,
      nextStatus: HousekeepingTaskStatus.CLEANING,
      nextRoomStatus: RoomStatus.CLEANING,
      taskEvent: HousekeepingEvents.HOUSEKEEPING_TASK_STARTED,
    });
  }

  async markClean(propertyId: string, request: AppRequest, taskId: string) {
    return this.transitionTask(propertyId, request, taskId, {
      expectedStatus: HousekeepingTaskStatus.CLEANING,
      nextStatus: HousekeepingTaskStatus.CLEAN,
      nextRoomStatus: RoomStatus.CLEAN,
      taskEvent: HousekeepingEvents.HOUSEKEEPING_TASK_CLEANED,
    });
  }

  async markReady(propertyId: string, request: AppRequest, taskId: string) {
    const result = await this.transitionTask(propertyId, request, taskId, {
      expectedStatus: HousekeepingTaskStatus.CLEAN,
      nextStatus: HousekeepingTaskStatus.READY,
      nextRoomStatus: RoomStatus.READY,
      taskEvent: HousekeepingEvents.HOUSEKEEPING_TASK_COMPLETED,
      closeTask: true,
    });

    await this.repository.enqueue('messaging', 'messaging.send', {
      tenantId: request.context.tenantId,
      propertyId,
      type: 'ROOM_READY',
      taskId: result.task.id,
      roomId: result.room.id,
    });

    return result;
  }

  async assignTask(
    propertyId: string,
    request: AppRequest,
    taskId: string,
    dto: AssignTaskDto,
  ) {
    const task = await this.getTaskOrThrow(propertyId, request, taskId);
    if (this.isTaskTerminal(task.status)) {
      throw new BadRequestException('Terminal housekeeping tasks cannot be assigned');
    }

    const now = new Date().toISOString();
    const before = { ...task };
    const updatedTask = {
      ...task,
      assignedUserId: dto.userId,
      updatedAt: now,
    };

    const savedTask = await this.repository.updateHousekeepingTask({
      task: updatedTask,
      expectedUpdatedAt: task.updatedAt,
    });

    if (!savedTask) {
      throw new ConflictException('Task was updated by another staff member. Refresh and retry.');
    }

    await this.auditService.recordMutation(request.context, {
      action: HousekeepingEvents.HOUSEKEEPING_TASK_ASSIGNED,
      entityType: 'HousekeepingTask',
      entityId: savedTask.id,
      propertyId,
      beforeJson: before,
      afterJson: savedTask,
    });

    return savedTask;
  }

  async createMaintenanceTicket(
    propertyId: string,
    request: AppRequest,
    dto: CreateMaintenanceTicketDto,
  ) {
    const tenantId = request.context.tenantId;
    const room = await this.repository.getRoom({
      tenantId,
      propertyId,
      roomId: dto.roomId,
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const now = new Date().toISOString();
    const ticket = await this.repository.createMaintenanceTicket({
      ticket: {
        id: randomUUID(),
        tenantId,
        propertyId,
        roomId: dto.roomId,
        title: dto.title,
        description: dto.description,
        severity: dto.severity,
        status: MaintenanceTicketStatus.OPEN,
        photoUrl: dto.photoUrl,
        reportedByUserId: request.context.userId,
        createdAt: now,
        updatedAt: now,
      },
    });

    await this.auditService.recordMutation(request.context, {
      action: HousekeepingEvents.MAINTENANCE_TICKET_CREATED,
      entityType: 'MaintenanceTicket',
      entityId: ticket.id,
      propertyId,
      afterJson: ticket,
    });

    if (dto.severity === MaintenanceSeverity.HIGH) {
      if (room.status !== RoomStatus.OCCUPIED) {
        const beforeRoom = { ...room };
        room.status = RoomStatus.DIRTY;
        await this.repository.updateRoom(room);

        await this.auditService.recordMutation(request.context, {
          action: HousekeepingEvents.ROOM_STATUS_CHANGED,
          entityType: 'Room',
          entityId: room.id,
          propertyId,
          beforeJson: beforeRoom,
          afterJson: {
            ...room,
            reason: 'HIGH_SEVERITY_MAINTENANCE',
          },
        });
      }

      await this.repository.enqueue('messaging', 'messaging.send', {
        tenantId,
        propertyId,
        type: 'HIGH_SEVERITY_MAINTENANCE',
        ticketId: ticket.id,
        roomId: room.id,
      });
    }

    return ticket;
  }

  async listMaintenanceTickets(
    propertyId: string,
    request: AppRequest,
    query: ListMaintenanceTicketsDto,
  ) {
    return this.repository.listMaintenanceTickets({
      tenantId: request.context.tenantId,
      propertyId,
      status: query.status,
      severity: query.severity,
      roomId: query.roomId,
    });
  }

  private async transitionTask(
    propertyId: string,
    request: AppRequest,
    taskId: string,
    options: {
      expectedStatus: HousekeepingTaskStatus;
      nextStatus: HousekeepingTaskStatus;
      nextRoomStatus: RoomStatus;
      taskEvent: string;
      closeTask?: boolean;
    },
  ) {
    const task = await this.getTaskOrThrow(propertyId, request, taskId);
    if (task.status !== options.expectedStatus) {
      throw new BadRequestException(
        `Invalid task transition from ${task.status} to ${options.nextStatus}`,
      );
    }

    const room = await this.repository.getRoom({
      tenantId: request.context.tenantId,
      propertyId,
      roomId: task.roomId,
    });

    if (!room) {
      throw new NotFoundException('Room not found for housekeeping task');
    }

    if (options.nextStatus === HousekeepingTaskStatus.READY && room.status === RoomStatus.OCCUPIED) {
      throw new ConflictException('Room is already occupied; cannot mark task READY');
    }

    const now = new Date().toISOString();
    const beforeTask = { ...task };
    const beforeRoom = { ...room };
    const updatedTask = {
      ...task,
      status: options.nextStatus,
      updatedAt: now,
      completedAt: options.closeTask ? now : task.completedAt,
    };

    const savedTask = await this.repository.updateHousekeepingTask({
      task: updatedTask,
      expectedUpdatedAt: task.updatedAt,
    });

    if (!savedTask) {
      throw new ConflictException('Task was updated by another staff member. Refresh and retry.');
    }

    room.status = options.nextRoomStatus;
    const updatedRoom = await this.repository.updateRoom(room);

    await this.auditService.recordMutation(request.context, {
      action: options.taskEvent,
      entityType: 'HousekeepingTask',
      entityId: savedTask.id,
      propertyId,
      beforeJson: beforeTask,
      afterJson: savedTask,
    });

    await this.auditService.recordMutation(request.context, {
      action: HousekeepingEvents.ROOM_STATUS_CHANGED,
      entityType: 'Room',
      entityId: updatedRoom.id,
      propertyId,
      beforeJson: beforeRoom,
      afterJson: updatedRoom,
    });

    return {
      task: savedTask,
      room: updatedRoom,
    };
  }

  private async getTaskOrThrow(propertyId: string, request: AppRequest, taskId: string) {
    const task = await this.repository.getHousekeepingTask({
      tenantId: request.context.tenantId,
      propertyId,
      taskId,
    });

    if (!task) {
      throw new NotFoundException('Housekeeping task not found');
    }

    return task;
  }

  private isTaskTerminal(status: HousekeepingTaskStatus): boolean {
    return [HousekeepingTaskStatus.READY, HousekeepingTaskStatus.CLOSED].includes(status);
  }
}
