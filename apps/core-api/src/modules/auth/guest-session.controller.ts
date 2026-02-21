import { Controller, Get, Req } from '@nestjs/common';
import { AppRequest } from '../../common/types/request-context';
import { AuthService } from './auth.service';

@Controller('guest')
export class GuestSessionController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  me(@Req() request: AppRequest) {
    return this.authService.getGuestSession(request);
  }
}
