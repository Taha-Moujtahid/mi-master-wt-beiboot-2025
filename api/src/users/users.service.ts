import { Injectable } from '@nestjs/common';
import { db } from '../db';
import { users } from '../schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class UsersService {
  async getProfile(userId: string) {
    return db.select().from(users).where(eq(users.id, userId)).then(rows => rows[0]);
  }
}
