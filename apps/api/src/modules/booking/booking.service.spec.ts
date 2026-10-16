import { BadRequestException, NotFoundException } from '@nestjs/common';
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
      findMany: ReturnType<typeof vi.fn>;
      deleteMany: ReturnType<typeof vi.fn>;
    };
    availabilityBlock: {
      create: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      deleteMany: ReturnType<typeof vi.fn>;
    };
    reservation: { findMany: ReturnType<typeof vi.fn> };
  };

  const tenantId = 'tenant-1';
  const listingId = 'listing-1';
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
        findMany: vi.fn().mockResolvedValue([]),
        deleteMany: vi.fn(),
      },
      availabilityBlock: {
        create: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
        deleteMany: vi.fn(),
      },
      reservation: { findMany: vi.fn().mockResolvedValue([]) },
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
      mockPrisma.reservation.findMany.mockResolvedValue([
        {
          startAt: new Date('2026-01-02T11:00:00.000Z'),
          endAt: new Date('2026-01-02T12:00:00.000Z'),
        },
      ]);

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
  });
});
