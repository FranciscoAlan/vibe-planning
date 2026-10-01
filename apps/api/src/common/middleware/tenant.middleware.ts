import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

export interface TenantRequest extends Request {
  tenantId?: string;
}

/**
 * Resolves the tenant for every request from the `x-tenant-id` header.
 * Placeholder resolution — real multi-tenant routing (subdomain/domain-based)
 * lands when the `directory`/`admin` modules define how tenants are provisioned.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: TenantRequest, _res: Response, next: NextFunction): void {
    const tenantId = req.header('x-tenant-id');
    if (tenantId) {
      req.tenantId = tenantId;
    }
    next();
  }
}
