import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { DirectoryService } from './directory.service.js';
import type { TenantRequest } from '../../common/middleware/tenant.middleware.js';
import {
  createListingSchema,
  updateListingSchema,
  listingFilterSchema,
  createPromotionSchema,
} from '@vibe-planners/shared-validations';

@Controller('directory')
export class DirectoryController {
  constructor(private readonly directoryService: DirectoryService) {}

  @Get('categories')
  async getCategories() {
    return this.directoryService.getCategories();
  }

  @Get('categories/:slug')
  async getCategoryBySlug(@Param('slug') slug: string) {
    return this.directoryService.getCategoryBySlug(slug);
  }

  @Get('listings')
  async getListings(@Req() req: TenantRequest, @Query() query: Record<string, unknown>) {
    const tenantId = req.tenantId || (req.headers['x-tenant-id'] as string);
    if (!tenantId) {
      throw new BadRequestException('x-tenant-id header is required');
    }

    const parsedQuery = listingFilterSchema.safeParse(query);
    if (!parsedQuery.success) {
      throw new BadRequestException({
        message: 'Invalid query filters',
        errors: parsedQuery.error.flatten(),
      });
    }

    return this.directoryService.getListings(tenantId, parsedQuery.data);
  }

  @Get('listings/:id')
  async getListingById(@Req() req: TenantRequest, @Param('id') id: string) {
    const tenantId = req.tenantId || (req.headers['x-tenant-id'] as string);
    if (!tenantId) {
      throw new BadRequestException('x-tenant-id header is required');
    }

    return this.directoryService.getListingById(id, tenantId);
  }

  @Post('listings')
  async createListing(@Req() req: TenantRequest, @Body() body: unknown) {
    const tenantId = req.tenantId || (req.headers['x-tenant-id'] as string);
    if (!tenantId) {
      throw new BadRequestException('x-tenant-id header is required');
    }

    const ownerId = (req.headers['x-user-id'] as string) || (body as { ownerId?: string })?.ownerId;
    if (!ownerId) {
      throw new BadRequestException('x-user-id header or ownerId in body is required');
    }

    const parsedBody = createListingSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new BadRequestException({
        message: 'Validation failed for listing creation',
        errors: parsedBody.error.flatten(),
      });
    }

    return this.directoryService.createListing(tenantId, ownerId, parsedBody.data);
  }

  @Put('listings/:id')
  async updateListing(@Req() req: TenantRequest, @Param('id') id: string, @Body() body: unknown) {
    const tenantId = req.tenantId || (req.headers['x-tenant-id'] as string);
    if (!tenantId) {
      throw new BadRequestException('x-tenant-id header is required');
    }

    const parsedBody = updateListingSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new BadRequestException({
        message: 'Validation failed for listing update',
        errors: parsedBody.error.flatten(),
      });
    }

    return this.directoryService.updateListing(id, tenantId, parsedBody.data);
  }

  @Post('listings/:id/promotions')
  async createPromotion(@Req() req: TenantRequest, @Param('id') id: string, @Body() body: unknown) {
    const tenantId = req.tenantId || (req.headers['x-tenant-id'] as string);
    if (!tenantId) {
      throw new BadRequestException('x-tenant-id header is required');
    }

    const parsedBody = createPromotionSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new BadRequestException({
        message: 'Validation failed for promotion creation',
        errors: parsedBody.error.flatten(),
      });
    }

    return this.directoryService.createPromotion(id, tenantId, parsedBody.data);
  }
}
