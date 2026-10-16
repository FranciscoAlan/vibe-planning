export type BookingMode = 'REQUEST_APPROVAL' | 'INSTANT';

export type ReservationStatus =
  'REQUESTED' | 'ACCEPTED_AWAITING_PAYMENT' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';

export interface IListingBookingSettings {
  id: string;
  tenantId: string;
  listingId: string;
  bookingMode: BookingMode;
  timezoneId: string;
  confirmationTimeHours: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface IAvailabilityWindow {
  id: string;
  tenantId: string;
  listingId: string;
  startAt: string;
  endAt: string;
  createdAt: string;
}

export interface IAvailabilityBlock {
  id: string;
  tenantId: string;
  listingId: string;
  startAt: string;
  endAt: string;
  reason: string | null;
  createdAt: string;
}

export interface IReservation {
  id: string;
  tenantId: string;
  listingId: string;
  customerId: string;
  startAt: string;
  endAt: string;
  timezoneId: string;
  status: ReservationStatus;
  expiresAt: string | null;
  cancelledById: string | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
}
