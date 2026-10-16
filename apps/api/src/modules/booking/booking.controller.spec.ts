import { BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BookingController } from './booking.controller.js';
import type { BookingService } from './booking.service.js';
import type { JwtPayload } from '../identity/strategies/jwt.strategy.js';

describe('BookingController', () => {
  let controller: BookingController;
  let mockBookingService: {
    configureListing: ReturnType<typeof vi.fn>;
    getAvailability: ReturnType<typeof vi.fn>;
    createAvailabilityWindow: ReturnType<typeof vi.fn>;
    listAvailabilityWindows: ReturnType<typeof vi.fn>;
    deleteAvailabilityWindow: ReturnType<typeof vi.fn>;
    createAvailabilityBlock: ReturnType<typeof vi.fn>;
    listAvailabilityBlocks: ReturnType<typeof vi.fn>;
    deleteAvailabilityBlock: ReturnType<typeof vi.fn>;
    createReservation: ReturnType<typeof vi.fn>;
    listCustomerReservations: ReturnType<typeof vi.fn>;
    listListingReservations: ReturnType<typeof vi.fn>;
    acceptReservation: ReturnType<typeof vi.fn>;
    rejectReservation: ReturnType<typeof vi.fn>;
    cancelReservation: ReturnType<typeof vi.fn>;
  };

  const listingId = '00000000-0000-0000-0000-000000000001';
  const windowId = '00000000-0000-0000-0000-000000000002';
  const blockId = '00000000-0000-0000-0000-000000000003';
  const provider: JwtPayload = { sub: 'provider-1', tenantId: 'tenant-1', role: 'PROVIDER' };
  const client: JwtPayload = { sub: 'client-1', tenantId: 'tenant-1', role: 'CLIENT' };
  const reservationId = '00000000-0000-0000-0000-000000000004';
  const requestFor = (user?: JwtPayload) =>
    ({ user, headers: { 'x-tenant-id': 'spoofed-tenant' } }) as never;

  beforeEach(() => {
    mockBookingService = {
      configureListing: vi.fn(),
      getAvailability: vi.fn(),
      createAvailabilityWindow: vi.fn(),
      listAvailabilityWindows: vi.fn(),
      deleteAvailabilityWindow: vi.fn(),
      createAvailabilityBlock: vi.fn(),
      listAvailabilityBlocks: vi.fn(),
      deleteAvailabilityBlock: vi.fn(),
      createReservation: vi.fn(),
      listCustomerReservations: vi.fn(),
      listListingReservations: vi.fn(),
      acceptReservation: vi.fn(),
      rejectReservation: vi.fn(),
      cancelReservation: vi.fn(),
    };
    controller = new BookingController(mockBookingService as unknown as BookingService);
  });

  it('configures a listing using authenticated provider and tenant IDs', async () => {
    const input = { timezoneId: 'America/Mexico_City' };
    mockBookingService.configureListing.mockResolvedValue({ bookingMode: 'REQUEST_APPROVAL' });

    await expect(
      controller.configureListing(requestFor(provider), listingId, input),
    ).resolves.toEqual({ bookingMode: 'REQUEST_APPROVAL' });
    expect(mockBookingService.configureListing).toHaveBeenCalledWith(
      'tenant-1',
      'provider-1',
      listingId,
      { bookingMode: 'REQUEST_APPROVAL', timezoneId: 'America/Mexico_City' },
    );
  });

  it('allows a client to query availability with validated local interval input', async () => {
    const query = { startAt: '2026-10-16T09:00', endAt: '2026-10-16T10:00' };
    mockBookingService.getAvailability.mockResolvedValue({ timezoneId: 'UTC' });

    await expect(controller.getAvailability(requestFor(client), listingId, query)).resolves.toEqual(
      { timezoneId: 'UTC' },
    );
    expect(mockBookingService.getAvailability).toHaveBeenCalledWith('tenant-1', listingId, query);
  });

  it('creates a reservation using the authenticated customer identity', async () => {
    const input = {
      listingId,
      startAt: '2026-10-16T09:00',
      endAt: '2026-10-16T10:00',
      customerId: 'attacker-selected-customer',
    };
    mockBookingService.createReservation.mockResolvedValue({ id: reservationId });

    await expect(controller.createReservation(requestFor(client), input)).resolves.toEqual({
      id: reservationId,
    });
    expect(mockBookingService.createReservation).toHaveBeenCalledWith('tenant-1', 'client-1', {
      listingId,
      startAt: '2026-10-16T09:00',
      endAt: '2026-10-16T10:00',
    });
  });

  it('lists reservations for the authenticated customer', async () => {
    mockBookingService.listCustomerReservations.mockResolvedValue([{ id: reservationId }]);

    await expect(controller.listCustomerReservations(requestFor(client))).resolves.toEqual([
      { id: reservationId },
    ]);
    expect(mockBookingService.listCustomerReservations).toHaveBeenCalledWith(
      'tenant-1',
      'client-1',
    );
  });

  it('lists a provider listing reservations using the authenticated provider identity', async () => {
    mockBookingService.listListingReservations.mockResolvedValue([{ id: reservationId }]);

    await expect(
      controller.listListingReservations(requestFor(provider), listingId),
    ).resolves.toEqual([{ id: reservationId }]);
    expect(mockBookingService.listListingReservations).toHaveBeenCalledWith(
      'tenant-1',
      'provider-1',
      listingId,
    );
  });

  it('routes reservation accept and reject actions for the authenticated provider', async () => {
    mockBookingService.acceptReservation.mockResolvedValue({ id: reservationId });
    mockBookingService.rejectReservation.mockResolvedValue({ id: reservationId });

    await controller.acceptReservation(requestFor(provider), reservationId);
    await controller.rejectReservation(requestFor(provider), reservationId);

    expect(mockBookingService.acceptReservation).toHaveBeenCalledWith(
      'tenant-1',
      'provider-1',
      reservationId,
    );
    expect(mockBookingService.rejectReservation).toHaveBeenCalledWith(
      'tenant-1',
      'provider-1',
      reservationId,
    );
  });

  it('cancels with actor identity from the authenticated principal and allows an omitted body', async () => {
    mockBookingService.cancelReservation.mockResolvedValue({ id: reservationId });

    await controller.cancelReservation(requestFor(client), reservationId);

    expect(mockBookingService.cancelReservation).toHaveBeenCalledWith(
      'tenant-1',
      'client-1',
      'CLIENT',
      reservationId,
      {},
    );
  });

  it('allows the authenticated listing provider to cancel a reservation', async () => {
    mockBookingService.cancelReservation.mockResolvedValue({ id: reservationId });

    await controller.cancelReservation(requestFor(provider), reservationId, {
      reason: 'Listing unavailable',
    });

    expect(mockBookingService.cancelReservation).toHaveBeenCalledWith(
      'tenant-1',
      'provider-1',
      'PROVIDER',
      reservationId,
      { reason: 'Listing unavailable' },
    );
  });

  it('creates an availability window for the authenticated provider', async () => {
    const input = { startAt: '2026-10-16T09:00', endAt: '2026-10-16T10:00' };
    mockBookingService.createAvailabilityWindow.mockResolvedValue({ id: windowId });

    await expect(
      controller.createAvailabilityWindow(requestFor(provider), listingId, input),
    ).resolves.toEqual({ id: windowId });
    expect(mockBookingService.createAvailabilityWindow).toHaveBeenCalledWith(
      'tenant-1',
      'provider-1',
      listingId,
      input,
    );
  });

  it('lists availability windows for the authenticated provider', async () => {
    mockBookingService.listAvailabilityWindows.mockResolvedValue([{ id: windowId }]);

    await expect(
      controller.listAvailabilityWindows(requestFor(provider), listingId),
    ).resolves.toEqual([{ id: windowId }]);
    expect(mockBookingService.listAvailabilityWindows).toHaveBeenCalledWith(
      'tenant-1',
      'provider-1',
      listingId,
    );
  });

  it('deletes an availability window for the authenticated provider', async () => {
    mockBookingService.deleteAvailabilityWindow.mockResolvedValue(undefined);

    await controller.deleteAvailabilityWindow(requestFor(provider), listingId, windowId);
    expect(mockBookingService.deleteAvailabilityWindow).toHaveBeenCalledWith(
      'tenant-1',
      'provider-1',
      listingId,
      windowId,
    );
  });

  it('creates an availability block for the authenticated provider', async () => {
    const input = {
      startAt: '2026-10-16T09:00',
      endAt: '2026-10-16T10:00',
      reason: 'Maintenance',
    };
    mockBookingService.createAvailabilityBlock.mockResolvedValue({ id: blockId });

    await expect(
      controller.createAvailabilityBlock(requestFor(provider), listingId, input),
    ).resolves.toEqual({ id: blockId });
    expect(mockBookingService.createAvailabilityBlock).toHaveBeenCalledWith(
      'tenant-1',
      'provider-1',
      listingId,
      input,
    );
  });

  it('lists availability blocks for the authenticated provider', async () => {
    mockBookingService.listAvailabilityBlocks.mockResolvedValue([{ id: blockId }]);

    await expect(
      controller.listAvailabilityBlocks(requestFor(provider), listingId),
    ).resolves.toEqual([{ id: blockId }]);
    expect(mockBookingService.listAvailabilityBlocks).toHaveBeenCalledWith(
      'tenant-1',
      'provider-1',
      listingId,
    );
  });

  it('deletes an availability block for the authenticated provider', async () => {
    mockBookingService.deleteAvailabilityBlock.mockResolvedValue(undefined);

    await controller.deleteAvailabilityBlock(requestFor(provider), listingId, blockId);
    expect(mockBookingService.deleteAvailabilityBlock).toHaveBeenCalledWith(
      'tenant-1',
      'provider-1',
      listingId,
      blockId,
    );
  });

  it('rejects missing authentication', async () => {
    expect(() =>
      controller.getAvailability(requestFor(), listingId, {
        startAt: '2026-10-16T09:00',
        endAt: '2026-10-16T10:00',
      }),
    ).toThrow(UnauthorizedException);
  });

  it.each([
    [
      'settings',
      (req: never) => controller.configureListing(req, listingId, { timezoneId: 'UTC' }),
    ],
    [
      'create window',
      (req: never) =>
        controller.createAvailabilityWindow(req, listingId, {
          startAt: '2026-10-16T09:00',
          endAt: '2026-10-16T10:00',
        }),
    ],
    ['list windows', (req: never) => controller.listAvailabilityWindows(req, listingId)],
    [
      'delete window',
      (req: never) => controller.deleteAvailabilityWindow(req, listingId, windowId),
    ],
    [
      'create block',
      (req: never) =>
        controller.createAvailabilityBlock(req, listingId, {
          startAt: '2026-10-16T09:00',
          endAt: '2026-10-16T10:00',
        }),
    ],
    ['list blocks', (req: never) => controller.listAvailabilityBlocks(req, listingId)],
    ['delete block', (req: never) => controller.deleteAvailabilityBlock(req, listingId, blockId)],
  ])('rejects a client attempting to %s', async (_operation, operation) => {
    expect(() => operation(requestFor(client))).toThrow(ForbiddenException);
  });

  it.each([
    [
      'create a reservation',
      (req: never) =>
        controller.createReservation(req, {
          listingId,
          startAt: '2026-10-16T09:00',
          endAt: '2026-10-16T10:00',
        }),
    ],
    ['list customer reservations', (req: never) => controller.listCustomerReservations(req)],
  ])('rejects a provider attempting to %s', async (_operation, operation) => {
    expect(() => operation(requestFor(provider))).toThrow(ForbiddenException);
  });

  it.each([
    [
      'list listing reservations',
      (req: never) => controller.listListingReservations(req, listingId),
    ],
    ['accept a reservation', (req: never) => controller.acceptReservation(req, reservationId)],
    ['reject a reservation', (req: never) => controller.rejectReservation(req, reservationId)],
  ])('rejects a client attempting to %s', async (_operation, operation) => {
    expect(() => operation(requestFor(client))).toThrow(ForbiddenException);
  });

  it('rejects invalid settings, intervals, and availability queries', async () => {
    expect(() =>
      controller.configureListing(requestFor(provider), listingId, { timezoneId: 'Not/A_Zone' }),
    ).toThrow(BadRequestException);
    expect(() =>
      controller.createAvailabilityWindow(requestFor(provider), listingId, {
        startAt: '2026-10-16T10:00',
        endAt: '2026-10-16T10:00',
      }),
    ).toThrow(BadRequestException);
    expect(() =>
      controller.getAvailability(requestFor(client), listingId, { startAt: 'invalid' }),
    ).toThrow(BadRequestException);

    expect(mockBookingService.configureListing).not.toHaveBeenCalled();
    expect(mockBookingService.createAvailabilityWindow).not.toHaveBeenCalled();
    expect(mockBookingService.getAvailability).not.toHaveBeenCalled();
  });
});
