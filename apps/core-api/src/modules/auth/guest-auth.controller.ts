import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { AppRequest } from '../../common/types/request-context';
import { ChangePasswordDto } from './dto/change-password.dto';
import { GuestLoginDto } from './dto/guest-login.dto';
import { GuestRegisterDto } from './dto/guest-register.dto';
import { AuthService } from './auth.service';

@Controller('guest/auth')
export class GuestAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(
    @Req() request: AppRequest,
    @Res({ passthrough: true }) response: Response,
    @Body() dto: GuestRegisterDto,
  ) {
    return this.authService.registerGuest(request, response, dto);
  }

  @Post('login')
  login(
    @Req() request: AppRequest,
    @Res({ passthrough: true }) response: Response,
    @Body() dto: GuestLoginDto,
  ) {
    return this.authService.loginGuest(request, response, dto);
  }

  @Post('refresh')
  refresh(@Req() request: AppRequest, @Res({ passthrough: true }) response: Response) {
    return this.authService.refreshGuest(request, response);
  }

  @Post('logout')
  logout(@Req() request: AppRequest, @Res({ passthrough: true }) response: Response) {
    return this.authService.logoutGuest(request, response);
  }

  @Post('change-password')
  changePassword(
    @Req() request: AppRequest,
    @Res({ passthrough: true }) response: Response,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changeGuestPassword(request, response, dto);
  }
}
