import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(username: string, password: string) {
    const existing = await this.prisma.user.findUnique({ where: { username } });
    if (existing) {
      throw new ConflictException('Username already taken');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { username, passwordHash },
    });
    return { id: user.id, username: user.username };
  }

  async login(username: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.issueToken(user);
  }

  /**
   * Signs an access token for one user.
   *
   * @param user Account the token authenticates.
   * @param expiresIn Optional lifetime overriding the module default.
   * @return The bearer token expected by the frontend.
   */
  issueToken(user: { id: number; username: string }, expiresIn?: JwtSignOptions['expiresIn']) {
    const payload = { sub: user.id, username: user.username };
    return { access_token: this.jwtService.sign(payload, expiresIn ? { expiresIn } : {}) };
  }
}
