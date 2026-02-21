import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { AppRequest } from '../../common/types/request-context';
import { AcceptStaffInviteDto } from './dto/accept-staff-invite.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { StaffLoginDto } from './dto/staff-login.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Req() request: AppRequest, @Res({ passthrough: true }) response: Response, @Body() dto: StaffLoginDto) {
    return this.authService.loginStaff(request, response, dto);
  }

  @Post('refresh')
  refresh(@Req() request: AppRequest, @Res({ passthrough: true }) response: Response) {
    return this.authService.refreshStaff(request, response);
  }

  @Post('logout')
  logout(@Req() request: AppRequest, @Res({ passthrough: true }) response: Response) {
    return this.authService.logoutStaff(request, response);
  }

  @Post('logout-all')
  logoutAll(@Req() request: AppRequest, @Res({ passthrough: true }) response: Response) {
    return this.authService.logoutAllStaff(request, response);
  }

  @Post('change-password')
  changePassword(
    @Req() request: AppRequest,
    @Res({ passthrough: true }) response: Response,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changeStaffPassword(request, response, dto);
  }

  @Post('forgot-password')
  forgotPassword(@Req() request: AppRequest, @Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(request, dto);
  }

  @Post('reset-password')
  resetPassword(
    @Req() request: AppRequest,
    @Res({ passthrough: true }) response: Response,
    @Body() dto: ResetPasswordDto,
  ) {
    return this.authService.resetPassword(request, response, dto);
  }

  @Post('invites/accept')
  acceptInvite(
    @Req() request: AppRequest,
    @Res({ passthrough: true }) response: Response,
    @Body() dto: AcceptStaffInviteDto,
  ) {
    return this.authService.acceptInvite(request, response, dto);
  }

  @Get('me')
  me(@Req() request: AppRequest) {
    return this.authService.getStaffSession(request);
  }
}
