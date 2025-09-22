
import { Module } from '@nestjs/common';

import { ProjectsController } from './projects/projects.controller';
import { ProjectsService } from './projects/projects.service';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';
import { KeycloakAuthGuard } from './keycloak-auth.guard';

@Module({
  imports: [],
  controllers: [ ProjectsController, UsersController],
  providers: [ ProjectsService, UsersService, KeycloakAuthGuard],
})
export class AppModule {}
