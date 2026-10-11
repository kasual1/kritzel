import {
  Controller,
  Get,
  Header,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.guard';
import { User } from '../user/user.entity';

interface JwtPayload {
  sub: string;
  email: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {
    // Passport redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleCallback(@Req() req: Request & { user: User }, @Res() res: Response) {
    const clientUrl = this.configService.get<string>('CLIENT_URL')!;
    const isHttpsClient = clientUrl.startsWith('https://');
    const jwt = this.authService.generateJwt(req.user);
    res.cookie('token', jwt, {
      httpOnly: true,
      secure: isHttpsClient,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
    res.redirect(clientUrl);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @Header('Cache-Control', 'no-store')
  async me(@Req() req: Request & { user: JwtPayload }) {
    const user = await this.authService.getUserByIdOrThrow(req.user.sub);
    return {
      id: user.id,
      email: user.email,
      displayName: user.name,
      picture: user.picture ?? null,
    };
  }

  @Get('ws-token')
  @UseGuards(JwtAuthGuard)
  @Header('Cache-Control', 'no-store')
  wsToken(@Req() req: Request & { user: JwtPayload }) {
    return { token: this.authService.generateWsToken(req.user) };
  }

  @Post('logout')
  logout(@Res() res: Response) {
    const clientUrl = this.configService.get<string>('CLIENT_URL')!;
    const isHttpsClient = clientUrl.startsWith('https://');
    res.clearCookie('token', {
      httpOnly: true,
      secure: isHttpsClient,
      sameSite: 'lax',
      path: '/',
    });
    res.json({ ok: true });
  }
}
