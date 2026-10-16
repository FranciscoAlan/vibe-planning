import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BookingService } from './booking.service.js';
import type { PrismaService } from '../../common/prisma/prisma.service.js';

describe('BookingService', () => {
  let service: BookingService;
  let mockPrisma: {
    listing: { findFirst: ReturnType<typeof vi.fn> };
    listingBookingSettings: {
      findFirst: ReturnType<typeof vi.fn>;
      upsert: ReturnType<typeof vi.fn>;
    };
    availabilityWindow: {
      create: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      deleteMany: ReturnType<typeof vi.fn>;
    };
    availabilityBlock: {
      create: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      deleteMany: ReturnType<typeof vi.fn>;
    };
    reservation: {
      findMany: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      updateMany: ReturnType<typeof vi.fn>;
    };
    bookingOutboxEvent: { create: ReturnType<typeof vi.fn> };
    $queryRaw: ReturnType<typeof vi.fn>;
    $transaction: ReturnType<typeof vi.fn>;
  };

  const tenantId = 'tenant-1';
  const listingId = '00000000-0000-0000-0000-000000000001';
  const ownerId = 'provider-1';

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    mockPrisma = {
      listing: { findFirst: vi.fn().mockResolvedValue({ id: listingId }) },
      listingBookingSettings: {
        findFirst: vi.fn().mockResolvedValue({
          tenantId,
          listingId,
          bookingMode: 'REQUEST_APPROVAL',
          timezoneId: 'UTC',
          confirmationTimeHours: null,
        }),
        upsert: vi.fn(),
      },
      availabilityWindow: {
        create: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
        deleteMany: vi.fn(),
      },
      availabilityBlock: {
        create: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
        deleteMany: vi.fn(),
      },
      reservation: {
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
      bookingOutboxEvent: { create: vi.fn() },
      $queryRaw: vi.fn().mockResolvedValue([]),
      $transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) =>
        callback(mockPrisma),
      ),
    };
    service = new BookingService(mockPrisma as unknown as PrismaService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('configureListing', () => {
    it('configures booking settings only for published listings in the tenant', async () => {
      const settings = {
        bookingMode: 'INSTANT' as const,
        timezoneId: 'America/Mexico_City',
        confirmationTimeHours: 12,
      };
      mockPrisma.listingBookingSettings.upsert.mockResolvedValue(settings);

      await expect(
        service.configureListing(tenantId, ownerId, listingId, settings),
      ).resolves.toEqual(settings);
      expect(mockPrisma.listing.findFirst).toHaveBeenCalledWith({
        where: { id: listingId, tenantId, status: 'PUBLISHED', ownerId },
        select: { id: true },
      });
      expect(mockPrisma.listingBookingSettings.upsert).toHaveBeenCalledWith({
        where: { listingId },
        create: { ...settings, tenantId, listingId },
        update: settings,
      });
    });

    it('does not configure a listing outside the tenant or not published', async () => {
      mockPrisma.listing.findFirst.mockResolvedValue(null);

      await expect(
        service.configureListing(tenantId, ownerId, listingId, { timezoneId: 'UTC' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(mockPrisma.listingBookingSettings.upsert).not.toHaveBeenCalled();
    });
  });

  describe('availability windows and blocks', () => {
    it('converts a local availability window to UTC using the listing timezone', async () => {
      mockPrisma.listingBookingSettings.findFirst.mockResolvedValue({
        timezoneId: 'America/New_York',
      });
      mockPrisma.availabilityWindow.create.mockImplementation(({ data }) => data);

      await expect(
        service.createAvailabilityWindow(tenantId, ownerId, listingId, {
          startAt: '2026-01-15T09:00',
          endAt: '2026-01-15T10:00',
        }),
      ).resolves.toEqual({
        tenantId,
        listingId,
        startAt: new Date('2026-01-15T14:00:00.000Z'),
        endAt: new Date('2026-01-15T15:00:00.000Z'),
      });
    });

    it.each([
      ['nonexistent', '2026-03-08T02:30'],
      ['ambiguous', '2026-11-01T01:30'],
    ])('rejects a %s local time during a daylight-saving transition', async (_kind, time) => {
      mockPrisma.listingBookingSettings.findFirst.mockResolvedValue({
        timezoneId: 'America/New_York',
      });

      await expect(
        service.createAvailabilityWindow(tenantId, ownerId, listingId, {
          startAt: time,
          endAt: '2026-11-02T10:00',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mockPrisma.availabilityWindow.create).not.toHaveBeenCalled();
    });

    it('creates blocks with the authenticated tenant and listing IDs', async () => {
      mockPrisma.availabilityBlock.create.mockImplementation(({ data }) => data);

      await expect(
        service.createAvailabilityBlock(tenantId, ownerId, listingId, {
          startAt: '2026-01-15T09:00',
          endAt: '2026-01-15T10:00',
          reason: 'Maintenance',
        }),
      ).resolves.toEqual({
        tenantId,
        listingId,
        startAt: new Date('2026-01-15T09:00:00.000Z'),
        endAt: new Date('2026-01-15T10:00:00.000Z'),
        reason: 'Maintenance',
      });
    });

    it('deletes a window only within its tenant and listing', async () => {
      mockPrisma.availabilityWindow.deleteMany.mockResolvedValue({ count: 1 });

      await service.deleteAvailabilityWindow(tenantId, ownerId, listingId, 'window-1');

      expect(mockPrisma.availabilityWindow.deleteMany).toHaveBeenCalledWith({
        where: { id: 'window-1', tenantId, listingId },
      });
    });
  });

  describe('createReservation', () => {
    const request = {
      listingId,
      startAt: '2026-01-02T09:00',
      endAt: '2026-01-02T10:00',
    };

    beforeEach(() => {
      mockPrisma.availabilityWindow.findFirst.mockResolvedValue({ id: 'window-1' });
      mockPrisma.availabilityBlock.findFirst.mockResolvedValue(null);
      mockPrisma.reservation.findFirst.mockResolvedValue(null);
      mockPrisma.reservation.create.mockImplementation(({ data }) => ({
        id: 'reservation-1',
        ...data,
      }));
      mockPrisma.bookingOutboxEvent.create.mockResolvedValue({});
    });

    it('creates an approval request with a listing-specific timeout and outbox event', async () => {
      mockPrisma.listingBookingSettings.findFirst.mockResolvedValue({
        bookingMode: 'REQUEST_APPROVAL',
        timezoneId: 'UTC',
        confirmationTimeHours: 12,
      });

      const result = await service.createReservation(tenantId, 'client-1', request);

      expect(result).toMatchObject({
        tenantId,
        listingId,
        customerId: 'client-1',
        status: 'REQUESTED',
        expiresAt: new Date('2026-01-01T12:00:00.000Z'),
      });
      expect(mockPrisma.$queryRaw).toHaveBeenCalledOnce();
      expect(mockPrisma.availabilityWindow.findFirst).toHaveBeenCalledWith({
        where: {
          tenantId,
          listingId,
          startAt: { lte: new Date('2026-01-02T09:00:00.000Z') },
          endAt: { gte: new Date('2026-01-02T10:00:00.000Z') },
        },
        select: { id: true },
      });
      expect(mockPrisma.bookingOutboxEvent.create).toHaveBeenCalledWith({
        data: {
          tenantId,
          reservationId: 'reservation-1',
          eventType: 'RESERVATION_REQUESTED',
          payload: {
            reservationId: 'reservation-1',
            listingId,
            customerId: 'client-1',
            status: 'REQUESTED',
          },
        },
      });
    });

    it('creates instant reservations as accepted with the system timeout', async () => {
      mockPrisma.listingBookingSettings.findFirst.mockResolvedValue({
        bookingMode: 'INSTANT',
        timezoneId: 'UTC',
        confirmationTimeHours: 4,
      });

      const result = await service.createReservation(tenantId, 'client-1', request);

      expect(result).toMatchObject({
        status: 'ACCEPTED_AWAITING_PAYMENT',
        expiresAt: new Date('2026-01-02T00:00:00.000Z'),
      });
      expect(mockPrisma.bookingOutboxEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventType: 'RESERVATION_ACCEPTED',
          payload: expect.objectContaining({ status: 'ACCEPTED_AWAITING_PAYMENT' }),
        }),
      });
    });

    it('rejects unavailable intervals and overlaps with active reservations', async () => {
      mockPrisma.listingBookingSettings.findFirst.mockResolvedValue({
        bookingMode: 'REQUEST_APPROVAL',
        timezoneId: 'UTC',
        confirmationTimeHours: null,
      });
      mockPrisma.reservation.findFirst.mockResolvedValue({ id: 'existing-reservation' });

      await expect(service.createReservation(tenantId, 'client-1', request)).rejects.toThrow(
        'already reserved',
      );
      expect(mockPrisma.reservation.create).not.toHaveBeenCalled();
      expect(mockPrisma.bookingOutboxEvent.create).not.toHaveBeenCalled();
    });

    it('rejects intervals outside an explicit window and intervals overlapping a block', async () => {
      mockPrisma.listingBookingSettings.findFirst.mockResolvedValue({
        bookingMode: 'REQUEST_APPROVAL',
        timezoneId: 'UTC',
        confirmationTimeHours: null,
      });
      mockPrisma.availabilityWindow.findFirst.mockResolvedValue(null);

      await expect(service.createReservation(tenantId, 'client-1', request)).rejects.toThrow(
        'explicit availability window',
      );

      mockPrisma.availabilityWindow.findFirst.mockResolvedValue({ id: 'window-1' });
      mockPrisma.availabilityBlock.findFirst.mockResolvedValue({ id: 'block-1' });

      await expect(service.createReservation(tenantId, 'client-1', request)).rejects.toThrow(
        'availability block',
      );
      expect(mockPrisma.reservation.create).not.toHaveBeenCalled();
    });

    it('rejects reservations beyond the 365-day horizon and empty intervals', async () => {
      await expect(
        service.createReservation(tenantId, 'client-1', {
          ...request,
          startAt: '2027-01-02T00:00',
          endAt: '2027-01-02T01:00',
        }),
      ).rejects.toThrow('next 365 days');
      await expect(
        service.createReservation(tenantId, 'client-1', {
          ...request,
          endAt: request.startAt,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mockPrisma.availabilityWindow.findFirst).not.toHaveBeenCalled();
    });

    it('allows adjacent reservations because intervals use half-open boundaries', async () => {
      mockPrisma.listingBookingSettings.findFirst.mockResolvedValue({
        bookingMode: 'REQUEST_APPROVAL',
        timezoneId: 'UTC',
        confirmationTimeHours: null,
      });
      mockPrisma.reservation.findFirst.mockResolvedValue(null);
      mockPrisma.reservation.create.mockImplementation(({ data }) => ({
        id: 'reservation-1',
        ...data,
      }));

      await service.createReservation(tenantId, 'client-1', request);
      await service.createReservation(tenantId, 'client-2', {
        ...request,
        startAt: request.endAt,
        endAt: '2026-01-02T11:00',
      });

      expect(mockPrisma.reservation.create).toHaveBeenCalledTimes(2);
      expect(mockPrisma.reservation.findFirst).toHaveBeenCalledWith({
        where: expect.objectContaining({
          startAt: { lt: new Date('2026-01-02T11:00:00.000Z') },
          endAt: { gt: new Date('2026-01-02T10:00:00.000Z') },
        }),
        select: { id: true },
      });
    });

    it('serializes concurrent overlapping requests on the listing lock', async () => {
      mockPrisma.listingBookingSettings.findFirst.mockResolvedValue({
        bookingMode: 'REQUEST_APPROVAL',
        timezoneId: 'UTC',
        confirmationTimeHours: null,
      });
      const reservations: Array<{ id: string; startAt: Date; endAt: Date }> = [];
      let transactionQueue = Promise.resolve();
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        let releaseTransaction = () => {};
        const currentTransaction = transactionQueue;
        transactionQueue = new Promise<void>((resolve) => {
          releaseTransaction = resolve;
        });
        await currentTransaction;
        try {
          return await callback(mockPrisma);
        } finally {
          releaseTransaction();
        }
      });
      mockPrisma.reservation.findFirst.mockImplementation(({ where }) => {
        if (!where.status) {
          return null;
        }
        return (
          reservations.find(
            (reservation) =>
              reservation.startAt < where.startAt.lt && reservation.endAt > where.endAt.gt,
          ) ?? null
        );
      });
      mockPrisma.reservation.create.mockImplementation(({ data }) => {
        const reservation = { id: `reservation-${reservations.length + 1}`, ...data };
        reservations.push(reservation);
        return reservation;
      });

      const results = await Promise.allSettled([
        service.createReservation(tenantId, 'client-1', request),
        service.createReservation(tenantId, 'client-2', request),
      ]);

      expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
      expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(2);
    });
  });

  describe('getAvailability', () => {
    const query = {
      startAt: '2026-01-02T09:00',
      endAt: '2026-01-02T13:00',
    };

    it('subtracts blocks and active reservations from explicit windows', async () => {
      mockPrisma.availabilityWindow.findMany.mockResolvedValue([
        {
          startAt: new Date('2026-01-02T09:00:00.000Z'),
          endAt: new Date('2026-01-02T13:00:00.000Z'),
        },
      ]);
      mockPrisma.availabilityBlock.findMany.mockResolvedValue([
        {
          startAt: new Date('2026-01-02T10:00:00.000Z'),
          endAt: new Date('2026-01-02T11:00:00.000Z'),
        },
      ]);
      mockPrisma.reservation.findMany.mockImplementation(({ where }) =>
        where.expiresAt?.lte
          ? []
          : [
              {
                startAt: new Date('2026-01-02T11:00:00.000Z'),
                endAt: new Date('2026-01-02T12:00:00.000Z'),
              },
            ],
      );

      await expect(service.getAvailability(tenantId, listingId, query)).resolves.toEqual({
        timezoneId: 'UTC',
        startAt: '2026-01-02T09:00:00.000Z',
        endAt: '2026-01-02T13:00:00.000Z',
        availableIntervals: [
          {
            startAt: '2026-01-02T09:00:00.000Z',
            endAt: '2026-01-02T10:00:00.000Z',
          },
          {
            startAt: '2026-01-02T12:00:00.000Z',
            endAt: '2026-01-02T13:00:00.000Z',
          },
        ],
      });
    });

    it('queries only within the tenant and listing for the next 365 days', async () => {
      await service.getAvailability(tenantId, listingId, query);

      expect(mockPrisma.availabilityWindow.findMany).toHaveBeenCalledWith({
        where: {
          tenantId,
          listingId,
          startAt: { lt: new Date('2026-01-02T13:00:00.000Z') },
          endAt: { gt: new Date('2026-01-02T09:00:00.000Z') },
        },
        orderBy: { startAt: 'asc' },
      });
    });

    it('rejects availability queries outside the next 365 days', async () => {
      await expect(
        service.getAvailability(tenantId, listingId, {
          startAt: '2027-01-02T00:00',
          endAt: '2027-01-02T01:00',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mockPrisma.availabilityWindow.findMany).not.toHaveBeenCalled();
    });

    it('expires elapsed reservations and emits an event before calculating availability', async () => {
      const expiredReservation = {
        id: 'expired-reservation',
        listingId,
        status: 'REQUESTED',
        expiresAt: new Date('2025-12-31T23:59:59.000Z'),
      };
      mockPrisma.reservation.findMany.mockImplementation(({ where }) =>
        where.expiresAt ? [expiredReservation] : [],
      );
      mockPrisma.reservation.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.bookingOutboxEvent.create.mockResolvedValue({});

      const result = await service.getAvailability(tenantId, listingId, query);

      expect(result.availableIntervals).toEqual([]);
      expect(mockPrisma.reservation.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'expired-reservation',
          tenantId,
          status: 'REQUESTED',
          expiresAt: { lte: new Date('2026-01-01T00:00:00.000Z') },
        },
        data: { status: 'EXPIRED' },
      });
      expect(mockPrisma.bookingOutboxEvent.create).toHaveBeenCalledWith({
        data: {
          tenantId,
          reservationId: 'expired-reservation',
          eventType: 'RESERVATION_EXPIRED',
          payload: {
            reservationId: 'expired-reservation',
            previousStatus: 'REQUESTED',
            status: 'EXPIRED',
          },
        },
      });
    });
  });

  describe('reservation decisions and cancellation', () => {
    const reservation = {
      id: 'reservation-1',
      tenantId,
      listingId,
      customerId: 'client-1',
      status: 'REQUESTED',
      expiresAt: new Date('2026-01-01T12:00:00.000Z'),
      listing: { ownerId },
    };

    beforeEach(() => {
      mockPrisma.reservation.findFirst.mockResolvedValue(reservation);
      mockPrisma.reservation.update.mockImplementation(({ data }) => ({
        ...reservation,
        ...data,
      }));
      mockPrisma.reservation.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.bookingOutboxEvent.create.mockResolvedValue({});
    });

    it('accepts and rejects approval requests with matching outbox events', async () => {
      mockPrisma.listingBookingSettings.findFirst.mockResolvedValue({
        bookingMode: 'REQUEST_APPROVAL',
      });

      const accepted = await service.acceptReservation(tenantId, ownerId, reservation.id);
      expect(accepted).toMatchObject({
        status: 'ACCEPTED_AWAITING_PAYMENT',
        expiresAt: new Date('2026-01-02T00:00:00.000Z'),
      });
      expect(mockPrisma.bookingOutboxEvent.create).toHaveBeenNthCalledWith(1, {
        data: expect.objectContaining({
          eventType: 'RESERVATION_ACCEPTED',
          payload: expect.objectContaining({
            previousStatus: 'REQUESTED',
            status: 'ACCEPTED_AWAITING_PAYMENT',
          }),
        }),
      });

      mockPrisma.reservation.update.mockClear();
      mockPrisma.bookingOutboxEvent.create.mockClear();
      const rejected = await service.rejectReservation(tenantId, ownerId, reservation.id);
      expect(rejected).toMatchObject({ status: 'REJECTED', expiresAt: null });
      expect(mockPrisma.bookingOutboxEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventType: 'RESERVATION_REJECTED',
          payload: expect.objectContaining({ status: 'REJECTED' }),
        }),
      });
    });

    it('expires an elapsed request when the provider attempts to decide it', async () => {
      mockPrisma.reservation.findFirst.mockResolvedValue({
        ...reservation,
        expiresAt: new Date('2025-12-31T23:59:59.000Z'),
      });
      mockPrisma.listingBookingSettings.findFirst.mockResolvedValue({
        bookingMode: 'REQUEST_APPROVAL',
      });

      await expect(
        service.acceptReservation(tenantId, ownerId, reservation.id),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(mockPrisma.reservation.update).not.toHaveBeenCalled();
      expect(mockPrisma.reservation.updateMany).toHaveBeenCalledWith({
        where: {
          id: reservation.id,
          tenantId,
          status: 'REQUESTED',
          expiresAt: { lte: new Date('2026-01-01T00:00:00.000Z') },
        },
        data: { status: 'EXPIRED' },
      });
      expect(mockPrisma.bookingOutboxEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ eventType: 'RESERVATION_EXPIRED' }),
      });
    });

    it('cancels only for the authenticated customer or listing owner and records the reason', async () => {
      const cancelled = await service.cancelReservation(
        tenantId,
        'client-1',
        'CLIENT',
        reservation.id,
        { reason: 'Plans changed' },
      );

      expect(cancelled).toMatchObject({
        status: 'CANCELLED',
        cancelledById: 'client-1',
        cancellationReason: 'Plans changed',
      });
      expect(mockPrisma.reservation.update).toHaveBeenCalledWith({
        where: { id: reservation.id },
        data: {
          status: 'CANCELLED',
          expiresAt: null,
          cancelledById: 'client-1',
          cancellationReason: 'Plans changed',
        },
      });
      expect(mockPrisma.bookingOutboxEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventType: 'RESERVATION_CANCELLED',
          payload: expect.objectContaining({ actorId: 'client-1', reason: 'Plans changed' }),
        }),
      });

      mockPrisma.reservation.update.mockClear();
      mockPrisma.bookingOutboxEvent.create.mockClear();
      await service.cancelReservation(tenantId, ownerId, 'PROVIDER', reservation.id, {});
      expect(mockPrisma.reservation.update).toHaveBeenCalledWith({
        where: { id: reservation.id },
        data: expect.objectContaining({
          status: 'CANCELLED',
          cancelledById: ownerId,
          cancellationReason: null,
        }),
      });
      expect(mockPrisma.bookingOutboxEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventType: 'RESERVATION_CANCELLED',
          payload: expect.objectContaining({ actorId: ownerId, actorRole: 'PROVIDER' }),
        }),
      });

      await expect(
        service.cancelReservation(tenantId, 'other-client', 'CLIENT', reservation.id, {}),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('propagates outbox failures so the transaction is rejected', async () => {
      const eventFailure = new Error('outbox unavailable');
      mockPrisma.listingBookingSettings.findFirst.mockResolvedValue({
        bookingMode: 'REQUEST_APPROVAL',
        timezoneId: 'UTC',
        confirmationTimeHours: null,
      });
      mockPrisma.availabilityWindow.findFirst.mockResolvedValue({ id: 'window-1' });
      mockPrisma.availabilityBlock.findFirst.mockResolvedValue(null);
      mockPrisma.reservation.findFirst.mockResolvedValue(null);
      mockPrisma.reservation.create.mockResolvedValue({ id: 'reservation-1' });
      mockPrisma.bookingOutboxEvent.create.mockRejectedValue(eventFailure);

      await expect(
        service.createReservation(tenantId, 'client-1', {
          listingId,
          startAt: '2026-01-02T09:00',
          endAt: '2026-01-02T10:00',
        }),
      ).rejects.toBe(eventFailure);
      expect(mockPrisma.$transaction).toHaveBeenCalledOnce();
      expect(mockPrisma.reservation.create).toHaveBeenCalledOnce();
      expect(mockPrisma.bookingOutboxEvent.create).toHaveBeenCalledOnce();
    });
  });
});
