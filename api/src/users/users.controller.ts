import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { KeycloakAuthGuard } from '../keycloak-auth.guard';
import { Request } from 'express';

@UseGuards(KeycloakAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@Req() req: Request) {
    const user = (req as any).user;
    return this.usersService.getProfile(user.id);
  }
}
