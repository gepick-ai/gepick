import { Module, ServiceModule } from '@gepick/core/common';
import { AuthController } from './auth/auth-controller';
import { GoogleOAuthProvider, OAuthController, OAuthService } from './oauth';
import { AuthService } from './auth/auth-service';
import { JwtService } from './auth/jwt-service';
import { MailService } from './auth/mail-service';
import { JwtGuard } from './auth/jwt-guard';

@Module({
  services: [
    AuthController,
    OAuthController,
    AuthService,
    JwtService,
    MailService,
    OAuthService,
    GoogleOAuthProvider,
    JwtGuard,
  ],
})
export class AuthModule extends ServiceModule {}
