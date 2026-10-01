import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Protects routes with a valid bearer JWT (see `strategies/jwt.strategy.ts`). */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
