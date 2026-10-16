import { z } from 'zod';

export const bookingModeEnum = z.enum(['REQUEST_APPROVAL', 'INSTANT']);

export const reservationStatusEnum = z.enum([
  'REQUESTED',
  'ACCEPTED_AWAITING_PAYMENT',
  'REJECTED',
  'EXPIRED',
  'CANCELLED',
]);

const localDateTimePattern =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/;

const localDateTimeValue = (value: string): number | null => {
  const parts = localDateTimePattern.exec(value);
  if (!parts) {
    return null;
  }

  const [
    ,
    yearText,
    monthText,
    dayText,
    hourText,
    minuteText,
    secondText = '0',
    fractionText = '0',
  ] = parts;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  const millisecond = Number(fractionText.padEnd(3, '0'));
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];

  if (
    year < 1 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > daysInMonth ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  ) {
    return null;
  }

  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(hour, minute, second, millisecond);
  return date.getTime();
};

const localDateTimeSchema = z
  .string()
  .regex(localDateTimePattern, 'Date-time must be local ISO format without a timezone offset')
  .refine(
    (value) => localDateTimeValue(value) !== null,
    'Date-time must be a valid calendar date and time',
  );

const validTimeZoneSchema = z
  .string()
  .min(1)
  .refine((timezoneId) => {
    try {
      new Intl.DateTimeFormat('en', { timeZone: timezoneId });
      return true;
    } catch (error) {
      if (error instanceof RangeError) {
        return false;
      }
      throw error;
    }
  }, 'timezoneId must be a valid IANA timezone');

const intervalShape = z.object({
  startAt: localDateTimeSchema,
  endAt: localDateTimeSchema,
});

const hasValidInterval = (interval: { startAt: string; endAt: string }) =>
  (localDateTimeValue(interval.endAt) ?? Number.NEGATIVE_INFINITY) >
  (localDateTimeValue(interval.startAt) ?? Number.POSITIVE_INFINITY);

const intervalError = {
  message: 'endAt must be after startAt',
  path: ['endAt'],
};

export const listingBookingSettingsSchema = z.object({
  bookingMode: bookingModeEnum.default('REQUEST_APPROVAL'),
  timezoneId: validTimeZoneSchema,
  confirmationTimeHours: z.number().int().positive().nullable().optional(),
});

export const availabilityWindowSchema = intervalShape.refine(hasValidInterval, intervalError);

export const availabilityBlockSchema = intervalShape
  .extend({
    reason: z.string().max(500).optional(),
  })
  .refine(hasValidInterval, intervalError);

export const availabilityQuerySchema = intervalShape.refine(hasValidInterval, intervalError);

export const createReservationSchema = intervalShape
  .extend({
    listingId: z.string().uuid(),
  })
  .refine(hasValidInterval, intervalError);

export const cancelReservationSchema = z.object({
  reason: z.string().max(500).optional(),
});

export type ListingBookingSettingsInput = z.input<typeof listingBookingSettingsSchema>;
export type AvailabilityWindowInput = z.infer<typeof availabilityWindowSchema>;
export type AvailabilityBlockInput = z.infer<typeof availabilityBlockSchema>;
export type AvailabilityQueryInput = z.infer<typeof availabilityQuerySchema>;
export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type CancelReservationInput = z.infer<typeof cancelReservationSchema>;
