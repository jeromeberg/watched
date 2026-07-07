import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async findUserByUsernameOrThrow(username: string) {
    const user = await this.user.findUnique({ where: { username } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
