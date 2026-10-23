import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { DirectoryService } from './directory.service.js';
import type { TenantRequest } from '../../common/middleware/tenant.middleware.js';
import {
  createListingSchema,
  updateListingSchema,
  listingFilterSchema,
  createPromotionSchema,
} from '@vibe-planners/shared-validations';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard.js';
import type { OrganizationJwtPayload } from '../identity/strategies/jwt.strategy.js';

type AuthenticatedTenantRequest = TenantRequest & { user?: OrganizationJwtPayload };

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
  @UseGuards(JwtAuthGuard)
  async createListing(@Req() req: AuthenticatedTenantRequest, @Body() body: unknown) {
    const { tenantId, userId } = this.requireProviderPrincipal(req);

    const parsedBody = createListingSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new BadRequestException({
        message: 'Validation failed for listing creation',
        errors: parsedBody.error.flatten(),
      });
    }

    return this.directoryService.createListing(tenantId, userId, parsedBody.data);
  }

  @Put('listings/:id')
  @UseGuards(JwtAuthGuard)
  async updateListing(
    @Req() req: AuthenticatedTenantRequest,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const { tenantId } = this.requireProviderPrincipal(req);

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
  @UseGuards(JwtAuthGuard)
  async createPromotion(
    @Req() req: AuthenticatedTenantRequest,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const { tenantId } = this.requireProviderPrincipal(req);

    const parsedBody = createPromotionSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new BadRequestException({
        message: 'Validation failed for promotion creation',
        errors: parsedBody.error.flatten(),
      });
    }

    return this.directoryService.createPromotion(id, tenantId, parsedBody.data);
  }

  private requireProviderPrincipal(req: AuthenticatedTenantRequest) {
    const principal = req.user;
    if (!principal?.sub || !principal.tenantId || !principal.role) {
      throw new UnauthorizedException('Authenticated organization context is required');
    }
    if (principal.role !== 'OWNER' && principal.role !== 'PROVIDER') {
      throw new ForbiddenException('Only organization owners and providers can edit listings');
    }
    return { tenantId: principal.tenantId, userId: principal.sub };
  }
}
