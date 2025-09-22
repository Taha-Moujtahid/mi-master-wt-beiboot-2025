import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class KeycloakAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];
    if (!authHeader) throw new UnauthorizedException('No auth header');
    const token = authHeader.split(' ')[1];
    if (!token) throw new UnauthorizedException('No token');
    try {
      // Verify JWT signature if KEYCLOAK_PUBLIC_KEY is set, otherwise just decode (not secure)
      let decoded: any;
      const key = process.env.KEYCLOAK_PUBLIC_KEY;
      if (key) {
        try {
          decoded = jwt.verify(token, key, { algorithms: ['RS256'] });
        } catch (err) {
          throw new UnauthorizedException('Invalid token signature');
        }
      } else {
        decoded = jwt.decode(token);
      }
      if (!decoded || typeof decoded !== 'object' || !decoded.sub) throw new UnauthorizedException('Invalid token');
      (request as any)['user'] = {
        id: decoded.sub,
        username: decoded.preferred_username || decoded.username || decoded.email || '',
        email: decoded.email || '',
        roles: decoded.realm_access?.roles || [],
      };
      return true;
    } catch (e) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
