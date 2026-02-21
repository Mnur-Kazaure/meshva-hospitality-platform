import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthIdentityService } from './auth-identity.service';
import { AuthPasswordService } from './auth-password.service';
import { AuthService } from './auth.service';
import { AuthTokenService } from './auth-token.service';
import { AuthTotpService } from './auth-totp.service';
import { GuestAuthController } from './guest-auth.controller';
import { GuestSessionController } from './guest-session.controller';
import { StaffManagementController } from './staff-management.controller';

@Module({
  controllers: [AuthController, GuestAuthController, GuestSessionController, StaffManagementController],
  providers: [
    AuthService,
    AuthTokenService,
    AuthPasswordService,
    AuthTotpService,
    AuthIdentityService,
  ],
  exports: [AuthService, AuthTokenService, AuthPasswordService, AuthIdentityService, AuthTotpService],
})
export class AuthModule {}
