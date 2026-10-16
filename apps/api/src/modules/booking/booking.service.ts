import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import {
  availabilityBlockSchema,
  availabilityQuerySchema,
  availabilityWindowSchema,
  listingBookingSettingsSchema,
} from '@vibe-planners/shared-validations';
import type {
  AvailabilityBlockInput,
  AvailabilityQueryInput,
  AvailabilityWindowInput,
  ListingBookingSettingsInput,
} from '@vibe-planners/shared-validations';

const BOOKING_HORIZON_MS = 365 * 24 * 60 * 60 * 1000;
const LOCAL_DATE_TIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/;

type SafeParseSchema<T> = {
  safeParse(
    input: unknown,
  ): { success: true; data: T } | { success: false; error: { issues: unknown } };
};

type Interval = {
  startAt: Date;
  endAt: Date;
};

@Injectable()
export class BookingService {
  constructor(private readonly prisma: PrismaService) {}

  async configureListing(
    tenantId: string,
    ownerId: string,
    listingId: string,
    input: ListingBookingSettingsInput,
  ) {
    const settings = this.parseInput(listingBookingSettingsSchema, input);
    await this.getPublishedListing(tenantId, listingId, ownerId);
    this.createFormatter(settings.timezoneId);

    return this.prisma.listingBookingSettings.upsert({
      where: { listingId },
      create: {
        ...settings,
        tenantId,
        listingId,
      },
      update: settings,
    });
  }

  async createAvailabilityWindow(
    tenantId: string,
    ownerId: string,
    listingId: string,
    input: AvailabilityWindowInput,
  ) {
    const interval = this.parseInput(availabilityWindowSchema, input);
    const { settings } = await this.getListingSettings(tenantId, listingId, ownerId);
    const { startAt, endAt } = this.toUtcInterval(interval, settings.timezoneId);

    return this.prisma.availabilityWindow.create({
      data: { tenantId, listingId, startAt, endAt },
    });
  }

  async listAvailabilityWindows(tenantId: string, ownerId: string, listingId: string) {
    await this.getPublishedListing(tenantId, listingId, ownerId);

    return this.prisma.availabilityWindow.findMany({
      where: { tenantId, listingId },
      orderBy: { startAt: 'asc' },
    });
  }

  async deleteAvailabilityWindow(
    tenantId: string,
    ownerId: string,
    listingId: string,
    windowId: string,
  ) {
    await this.getPublishedListing(tenantId, listingId, ownerId);
    const result = await this.prisma.availabilityWindow.deleteMany({
      where: { id: windowId, tenantId, listingId },
    });

    if (result.count === 0) {
      throw new NotFoundException('Availability window not found');
    }
  }

  async createAvailabilityBlock(
    tenantId: string,
    ownerId: string,
    listingId: string,
    input: AvailabilityBlockInput,
  ) {
    const block = this.parseInput(availabilityBlockSchema, input);
    const { settings } = await this.getListingSettings(tenantId, listingId, ownerId);
    const { startAt, endAt } = this.toUtcInterval(block, settings.timezoneId);

    return this.prisma.availabilityBlock.create({
      data: {
        tenantId,
        listingId,
        startAt,
        endAt,
        reason: block.reason,
      },
    });
  }

  async listAvailabilityBlocks(tenantId: string, ownerId: string, listingId: string) {
    await this.getPublishedListing(tenantId, listingId, ownerId);

    return this.prisma.availabilityBlock.findMany({
      where: { tenantId, listingId },
      orderBy: { startAt: 'asc' },
    });
  }

  async deleteAvailabilityBlock(
    tenantId: string,
    ownerId: string,
    listingId: string,
    blockId: string,
  ) {
    await this.getPublishedListing(tenantId, listingId, ownerId);
    const result = await this.prisma.availabilityBlock.deleteMany({
      where: { id: blockId, tenantId, listingId },
    });

    if (result.count === 0) {
      throw new NotFoundException('Availability block not found');
    }
  }

  async getAvailability(tenantId: string, listingId: string, input: AvailabilityQueryInput) {
    const query = this.parseInput(availabilityQuerySchema, input);
    const { settings } = await this.getListingSettings(tenantId, listingId);
    const { startAt, endAt } = this.toUtcInterval(query, settings.timezoneId);
    const now = new Date();
    const horizon = new Date(now.getTime() + BOOKING_HORIZON_MS);

    if (startAt < now || endAt > horizon) {
      throw new BadRequestException('Availability queries must be within the next 365 days');
    }

    const [windows, blocks, reservations] = await Promise.all([
      this.prisma.availabilityWindow.findMany({
        where: {
          tenantId,
          listingId,
          startAt: { lt: endAt },
          endAt: { gt: startAt },
        },
        orderBy: { startAt: 'asc' },
      }),
      this.prisma.availabilityBlock.findMany({
        where: {
          tenantId,
          listingId,
          startAt: { lt: endAt },
          endAt: { gt: startAt },
        },
      }),
      this.prisma.reservation.findMany({
        where: {
          tenantId,
          listingId,
          status: { in: ['REQUESTED', 'ACCEPTED_AWAITING_PAYMENT'] },
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          startAt: { lt: endAt },
          endAt: { gt: startAt },
        },
        select: { startAt: true, endAt: true },
      }),
    ]);

    const availableIntervals = this.calculateAvailability({ startAt, endAt }, windows, [
      ...blocks,
      ...reservations,
    ]);

    return {
      timezoneId: settings.timezoneId,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      availableIntervals: availableIntervals.map((interval) => ({
        startAt: interval.startAt.toISOString(),
        endAt: interval.endAt.toISOString(),
      })),
    };
  }

  private parseInput<T>(schema: SafeParseSchema<T>, input: unknown): T {
    const result = schema.safeParse(input);
    if (!result.success) {
      throw new BadRequestException(result.error.issues);
    }
    return result.data;
  }

  private async getPublishedListing(tenantId: string, listingId: string, ownerId?: string) {
    const listing = await this.prisma.listing.findFirst({
      where: {
        id: listingId,
        tenantId,
        status: 'PUBLISHED',
        ...(ownerId ? { ownerId } : {}),
      },
      select: { id: true },
    });

    if (!listing) {
      throw new NotFoundException('Published listing not found');
    }

    return listing;
  }

  private async getListingSettings(tenantId: string, listingId: string, ownerId?: string) {
    await this.getPublishedListing(tenantId, listingId, ownerId);
    const settings = await this.prisma.listingBookingSettings.findFirst({
      where: { tenantId, listingId },
    });

    if (!settings) {
      throw new NotFoundException('Booking settings not found for listing');
    }

    return { settings };
  }

  private toUtcInterval(
    interval: { startAt: string; endAt: string },
    timezoneId: string,
  ): Interval {
    const formatter = this.createFormatter(timezoneId);
    const startAt = this.localDateTimeToUtc(interval.startAt, formatter);
    const endAt = this.localDateTimeToUtc(interval.endAt, formatter);

    if (endAt <= startAt) {
      throw new BadRequestException('The interval must have a positive duration');
    }

    return { startAt, endAt };
  }

  private createFormatter(timezoneId: string): Intl.DateTimeFormat {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: timezoneId,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
      });
    } catch (error) {
      if (error instanceof RangeError) {
        throw new BadRequestException('timezoneId must be a valid IANA timezone');
      }
      throw error;
    }
  }

  private localDateTimeToUtc(localDateTime: string, formatter: Intl.DateTimeFormat): Date {
    const match = LOCAL_DATE_TIME_PATTERN.exec(localDateTime);
    if (!match) {
      throw new BadRequestException('Date-time must be local ISO format without a timezone offset');
    }

    const [, year, month, day, hour, minute, second = '0', fraction = '0'] = match;
    const millisecond = Number(fraction.padEnd(3, '0'));
    const localEpoch = new Date(0);
    localEpoch.setUTCFullYear(Number(year), Number(month) - 1, Number(day));
    localEpoch.setUTCHours(Number(hour), Number(minute), Number(second), millisecond);
    const expectedWallTime = localEpoch.getTime();
    const offsets = new Set<number>();

    for (let hours = -48; hours <= 48; hours += 3) {
      const sample = new Date(expectedWallTime + hours * 60 * 60 * 1000);
      offsets.add(this.wallTimeEpoch(sample, formatter) - sample.getTime());
    }

    const candidates = new Set<number>();
    for (const offset of offsets) {
      const candidate = expectedWallTime - offset;
      if (this.wallTimeEpoch(new Date(candidate), formatter) === expectedWallTime) {
        candidates.add(candidate);
      }
    }

    if (candidates.size === 0) {
      throw new BadRequestException(
        `${localDateTime} does not exist in timezone ${formatter.resolvedOptions().timeZone}`,
      );
    }
    if (candidates.size > 1) {
      throw new BadRequestException(
        `${localDateTime} is ambiguous in timezone ${formatter.resolvedOptions().timeZone}`,
      );
    }

    const [candidate] = candidates;
    if (candidate === undefined) {
      throw new BadRequestException(`Unable to resolve ${localDateTime} in the requested timezone`);
    }

    return new Date(candidate);
  }

  private wallTimeEpoch(instant: Date, formatter: Intl.DateTimeFormat): number {
    const parts = formatter.formatToParts(instant);
    const values = new Map(parts.map((part) => [part.type, part.value]));
    const wallTime = new Date(0);
    wallTime.setUTCFullYear(
      Number(values.get('year')),
      Number(values.get('month')) - 1,
      Number(values.get('day')),
    );
    wallTime.setUTCHours(
      Number(values.get('hour')),
      Number(values.get('minute')),
      Number(values.get('second')),
      instant.getUTCMilliseconds(),
    );
    return wallTime.getTime();
  }

  private calculateAvailability(
    query: Interval,
    windows: Array<{ startAt: Date; endAt: Date }>,
    occupiedIntervals: Array<{ startAt: Date; endAt: Date }>,
  ): Interval[] {
    let available = this.mergeIntervals(
      windows.map((window) => ({
        startAt: new Date(Math.max(window.startAt.getTime(), query.startAt.getTime())),
        endAt: new Date(Math.min(window.endAt.getTime(), query.endAt.getTime())),
      })),
    );

    for (const occupied of occupiedIntervals) {
      const remaining: Interval[] = [];
      for (const interval of available) {
        if (occupied.endAt <= interval.startAt || occupied.startAt >= interval.endAt) {
          remaining.push(interval);
          continue;
        }
        if (occupied.startAt > interval.startAt) {
          remaining.push({ startAt: interval.startAt, endAt: occupied.startAt });
        }
        if (occupied.endAt < interval.endAt) {
          remaining.push({ startAt: occupied.endAt, endAt: interval.endAt });
        }
      }
      available = remaining;
    }

    return this.mergeIntervals(available);
  }

  private mergeIntervals(intervals: Interval[]): Interval[] {
    const sorted = intervals
      .filter((interval) => interval.startAt < interval.endAt)
      .sort((left, right) => left.startAt.getTime() - right.startAt.getTime());
    const merged: Interval[] = [];

    for (const interval of sorted) {
      const previous = merged.at(-1);
      if (!previous || interval.startAt > previous.endAt) {
        merged.push({ ...interval });
      } else if (interval.endAt > previous.endAt) {
        previous.endAt = interval.endAt;
      }
    }

    return merged;
  }
}
