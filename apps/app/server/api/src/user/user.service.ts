import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private userRepo: Repository<User>) {}

  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOneBy({ id });
  }

  async findOrCreate(profile: {
    googleId: string;
    email: string;
    name: string;
    picture: string;
  }): Promise<User> {
    let user = await this.userRepo.findOneBy({ googleId: profile.googleId });
    if (!user) {
      user = this.userRepo.create(profile);
      await this.userRepo.save(user);
    }
    return user;
  }

  async findByIds(
    ids: string[],
  ): Promise<Pick<User, 'id' | 'name' | 'email' | 'picture'>[]> {
    if (ids.length === 0) return [];
    return this.userRepo.find({
      where: { id: In(ids) },
      select: ['id', 'name', 'email', 'picture'],
    });
  }
}
