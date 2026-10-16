import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  availabilityBlockSchema,
  availabilityQuerySchema,
  availabilityWindowSchema,
  cancelReservationSchema,
  createReservationSchema,
  listingBookingSettingsSchema,
} from '@vibe-planners/shared-validations';
import type {
  AvailabilityBlockInput,
  AvailabilityQueryInput,
  AvailabilityWindowInput,
  CancelReservationInput,
  CreateReservationInput,
  ListingBookingSettingsInput,
} from '@vibe-planners/shared-validations';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard.js';
import type { JwtPayload } from '../identity/strategies/jwt.strategy.js';
import { BookingService } from './booking.service.js';

type AuthenticatedRequest = Request & { user?: JwtPayload };

type SafeParseSchema<T> = {
  safeParse(
    input: unknown,
  ): { success: true; data: T } | { success: false; error: { flatten(): unknown } };
};

@Controller('booking')
@UseGuards(JwtAuthGuard)
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Put('listings/:listingId/settings')
  configureListing(
    @Req() req: AuthenticatedRequest,
    @Param('listingId', ParseUUIDPipe) listingId: string,
    @Body() body: unknown,
  ) {
    const principal = this.requirePrincipal(req);
    this.requireRole(principal, 'PROVIDER');
    const input = this.parseBody<ListingBookingSettingsInput>(
      listingBookingSettingsSchema,
      body,
      'Invalid booking settings',
    );

    return this.bookingService.configureListing(
      principal.tenantId,
      principal.sub,
      listingId,
      input,
    );
  }

  @Get('listings/:listingId/availability')
  getAvailability(
    @Req() req: AuthenticatedRequest,
    @Param('listingId', ParseUUIDPipe) listingId: string,
    @Query() query: Record<string, unknown>,
  ) {
    const principal = this.requirePrincipal(req);
    this.requireCustomerOrProvider(principal);
    const input = this.parseBody<AvailabilityQueryInput>(
      availabilityQuerySchema,
      query,
      'Invalid availability query',
    );

    return this.bookingService.getAvailability(principal.tenantId, listingId, input);
  }

  @Post('reservations')
  createReservation(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    const principal = this.requirePrincipal(req);
    this.requireRole(principal, 'CLIENT');
    const input = this.parseBody<CreateReservationInput>(
      createReservationSchema,
      body,
      'Invalid reservation request',
    );

    return this.bookingService.createReservation(principal.tenantId, principal.sub, input);
  }

  @Get('reservations')
  listCustomerReservations(@Req() req: AuthenticatedRequest) {
    const principal = this.requirePrincipal(req);
    this.requireRole(principal, 'CLIENT');

    return this.bookingService.listCustomerReservations(principal.tenantId, principal.sub);
  }

  @Get('listings/:listingId/reservations')
  listListingReservations(
    @Req() req: AuthenticatedRequest,
    @Param('listingId', ParseUUIDPipe) listingId: string,
  ) {
    const principal = this.requirePrincipal(req);
    this.requireRole(principal, 'PROVIDER');

    return this.bookingService.listListingReservations(
      principal.tenantId,
      principal.sub,
      listingId,
    );
  }

  @Post('reservations/:reservationId/accept')
  acceptReservation(
    @Req() req: AuthenticatedRequest,
    @Param('reservationId', ParseUUIDPipe) reservationId: string,
  ) {
    const principal = this.requirePrincipal(req);
    this.requireRole(principal, 'PROVIDER');

    return this.bookingService.acceptReservation(principal.tenantId, principal.sub, reservationId);
  }

  @Post('reservations/:reservationId/reject')
  rejectReservation(
    @Req() req: AuthenticatedRequest,
    @Param('reservationId', ParseUUIDPipe) reservationId: string,
  ) {
    const principal = this.requirePrincipal(req);
    this.requireRole(principal, 'PROVIDER');

    return this.bookingService.rejectReservation(principal.tenantId, principal.sub, reservationId);
  }

  @Post('reservations/:reservationId/cancel')
  cancelReservation(
    @Req() req: AuthenticatedRequest,
    @Param('reservationId', ParseUUIDPipe) reservationId: string,
    @Body() body: unknown = {},
  ) {
    const principal = this.requirePrincipal(req);
    const actorRole = this.requireCustomerOrProvider(principal);
    const input = this.parseBody<CancelReservationInput>(
      cancelReservationSchema,
      body,
      'Invalid cancellation request',
    );

    return this.bookingService.cancelReservation(
      principal.tenantId,
      principal.sub,
      actorRole,
      reservationId,
      input,
    );
  }

  @Post('listings/:listingId/availability/windows')
  createAvailabilityWindow(
    @Req() req: AuthenticatedRequest,
    @Param('listingId', ParseUUIDPipe) listingId: string,
    @Body() body: unknown,
  ) {
    const principal = this.requirePrincipal(req);
    this.requireRole(principal, 'PROVIDER');
    const input = this.parseBody<AvailabilityWindowInput>(
      availabilityWindowSchema,
      body,
      'Invalid availability window',
    );

    return this.bookingService.createAvailabilityWindow(
      principal.tenantId,
      principal.sub,
      listingId,
      input,
    );
  }

  @Get('listings/:listingId/availability/windows')
  listAvailabilityWindows(
    @Req() req: AuthenticatedRequest,
    @Param('listingId', ParseUUIDPipe) listingId: string,
  ) {
    const principal = this.requirePrincipal(req);
    this.requireRole(principal, 'PROVIDER');

    return this.bookingService.listAvailabilityWindows(
      principal.tenantId,
      principal.sub,
      listingId,
    );
  }

  @Delete('listings/:listingId/availability/windows/:windowId')
  deleteAvailabilityWindow(
    @Req() req: AuthenticatedRequest,
    @Param('listingId', ParseUUIDPipe) listingId: string,
    @Param('windowId', ParseUUIDPipe) windowId: string,
  ) {
    const principal = this.requirePrincipal(req);
    this.requireRole(principal, 'PROVIDER');

    return this.bookingService.deleteAvailabilityWindow(
      principal.tenantId,
      principal.sub,
      listingId,
      windowId,
    );
  }

  @Post('listings/:listingId/availability/blocks')
  createAvailabilityBlock(
    @Req() req: AuthenticatedRequest,
    @Param('listingId', ParseUUIDPipe) listingId: string,
    @Body() body: unknown,
  ) {
    const principal = this.requirePrincipal(req);
    this.requireRole(principal, 'PROVIDER');
    const input = this.parseBody<AvailabilityBlockInput>(
      availabilityBlockSchema,
      body,
      'Invalid availability block',
    );

    return this.bookingService.createAvailabilityBlock(
      principal.tenantId,
      principal.sub,
      listingId,
      input,
    );
  }

  @Get('listings/:listingId/availability/blocks')
  listAvailabilityBlocks(
    @Req() req: AuthenticatedRequest,
    @Param('listingId', ParseUUIDPipe) listingId: string,
  ) {
    const principal = this.requirePrincipal(req);
    this.requireRole(principal, 'PROVIDER');

    return this.bookingService.listAvailabilityBlocks(principal.tenantId, principal.sub, listingId);
  }

  @Delete('listings/:listingId/availability/blocks/:blockId')
  deleteAvailabilityBlock(
    @Req() req: AuthenticatedRequest,
    @Param('listingId', ParseUUIDPipe) listingId: string,
    @Param('blockId', ParseUUIDPipe) blockId: string,
  ) {
    const principal = this.requirePrincipal(req);
    this.requireRole(principal, 'PROVIDER');

    return this.bookingService.deleteAvailabilityBlock(
      principal.tenantId,
      principal.sub,
      listingId,
      blockId,
    );
  }

  private requirePrincipal(req: AuthenticatedRequest): JwtPayload {
    const principal = req.user;
    if (!principal?.sub || !principal.tenantId || !principal.role) {
      throw new UnauthorizedException('Authenticated user and tenant are required');
    }
    return principal;
  }

  private requireRole(principal: JwtPayload, role: 'PROVIDER' | 'CLIENT'): void {
    if (principal.role !== role) {
      throw new ForbiddenException(`Only ${role.toLowerCase()}s can perform this operation`);
    }
  }

  private requireCustomerOrProvider(principal: JwtPayload): 'CLIENT' | 'PROVIDER' {
    if (principal.role !== 'CLIENT' && principal.role !== 'PROVIDER') {
      throw new ForbiddenException('Only clients and providers can view availability');
    }
    return principal.role;
  }

  private parseBody<T>(schema: SafeParseSchema<T>, body: unknown, message: string): T {
    const result = schema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException({
        message,
        errors: result.error.flatten(),
      });
    }
    return result.data;
  }
}
