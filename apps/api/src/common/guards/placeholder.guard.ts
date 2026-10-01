import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * Placeholder guard: always allows the request through.
 * Replaced by the real auth/tenant guards once the `identity` module is implemented.
 */
@Injectable()
export class PlaceholderGuard implements CanActivate {
  canActivate(
    _context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return true;
  }
}
