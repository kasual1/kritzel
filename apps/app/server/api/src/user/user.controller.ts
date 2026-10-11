import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { UserService } from './user.service';

const MAX_BATCH_SIZE = 50;

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('lookup')
  async lookup(@Body() body: { userIds?: unknown }) {
    const { userIds } = body ?? {};

    if (
      !Array.isArray(userIds) ||
      userIds.length === 0 ||
      userIds.length > MAX_BATCH_SIZE ||
      !userIds.every((id) => typeof id === 'string' && id.length > 0)
    ) {
      throw new BadRequestException(
        `userIds must be a non-empty string array with at most ${MAX_BATCH_SIZE} items`,
      );
    }

    const unique = [...new Set(userIds as string[])];
    const found = await this.userService.findByIds(unique);
    const foundMap = new Map(found.map((u) => [u.id, u]));

    return {
      users: unique.map((id) => {
        const u = foundMap.get(id);
        return u
          ? {
              id: u.id,
              displayName: u.name,
              profileImageUrl: u.picture ?? undefined,
            }
          : { id, displayName: 'Guest' };
      }),
    };
  }
}
