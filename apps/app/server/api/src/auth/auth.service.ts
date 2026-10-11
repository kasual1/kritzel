import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateGoogleUser(profile: {
    googleId: string;
    email: string;
    name: string;
    picture: string;
  }): Promise<User> {
    return this.userService.findOrCreate(profile);
  }

  async getUserByIdOrThrow(userId: string): Promise<User> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }

  generateJwt(user: User): string {
    return this.jwtService.sign({ sub: user.id, email: user.email });
  }

  generateWsToken(payload: { sub: string; email: string }): string {
    return this.jwtService.sign(
      { sub: payload.sub, email: payload.email, aud: 'ws' },
      { expiresIn: '2m' },
    );
  }
}
