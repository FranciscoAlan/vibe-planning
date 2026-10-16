import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import request from 'supertest';
import { App } from 'supertest/types';
import { BookingModule } from '../src/modules/booking/booking.module.js';
import { JwtStrategy } from '../src/modules/identity/strategies/jwt.strategy.js';
import { PrismaService } from '../src/common/prisma/prisma.service.js';

type Row = Record<string, unknown>;

const ids = {
  tenantA: '10000000-0000-4000-8000-000000000001',
  tenantB: '10000000-0000-4000-8000-000000000002',
  clientA: '20000000-0000-4000-8000-000000000001',
  clientB: '20000000-0000-4000-8000-000000000002',
  providerA: '30000000-0000-4000-8000-000000000001',
  providerB: '30000000-0000-4000-8000-000000000002',
  listingA: '40000000-0000-4000-8000-000000000001',
  listingB: '40000000-0000-4000-8000-000000000002',
};

function matches(row: Row, where: Row = {}): boolean {
  return Object.entries(where).every(([field, condition]) => {
    if (field === 'OR') {
      return Array.isArray(condition) && condition.some((clause) => matches(row, clause as Row));
    }
    if (field === 'AND') {
      return Array.isArray(condition) && condition.every((clause) => matches(row, clause as Row));
    }

    const value = row[field];
    if (condition !== null && typeof condition === 'object' && !(condition instanceof Date)) {
      return Object.entries(condition).every(([operator, expected]) => {
        if (operator === 'in') {
          return Array.isArray(expected) && expected.includes(value);
        }
        const actualTime = value instanceof Date ? value.getTime() : value;
        const expectedTime = expected instanceof Date ? expected.getTime() : expected;
        if (operator === 'lt')
          return typeof actualTime === 'number' && typeof expectedTime === 'number'
            ? actualTime < expectedTime
            : String(actualTime) < String(expectedTime);
        if (operator === 'lte')
          return typeof actualTime === 'number' && typeof expectedTime === 'number'
            ? actualTime <= expectedTime
            : String(actualTime) <= String(expectedTime);
        if (operator === 'gt')
          return typeof actualTime === 'number' && typeof expectedTime === 'number'
            ? actualTime > expectedTime
            : String(actualTime) > String(expectedTime);
        if (operator === 'gte')
          return typeof actualTime === 'number' && typeof expectedTime === 'number'
            ? actualTime >= expectedTime
            : String(actualTime) >= String(expectedTime);
        return false;
      });
    }
    return value === condition;
  });
}

function createPrismaMock() {
  const listings: Row[] = [
    { id: ids.listingA, tenantId: ids.tenantA, ownerId: ids.providerA, status: 'PUBLISHED' },
    { id: ids.listingB, tenantId: ids.tenantB, ownerId: ids.providerB, status: 'PUBLISHED' },
  ];
  const settings: Row[] = [];
  const windows: Row[] = [];
  const blocks: Row[] = [];
  const reservations: Row[] = [];
  const outbox: Row[] = [];
  let nextId = 1;

  const createDelegate = (rows: Row[]) => ({
    findFirst: vi.fn(async ({ where }: Row) => rows.find((row) => matches(row, where)) ?? null),
    findMany: vi.fn(async ({ where }: Row = {}) => rows.filter((row) => matches(row, where))),
    create: vi.fn(async ({ data }: Row) => {
      const row = { id: `50000000-0000-4000-8000-${String(nextId++).padStart(12, '0')}`, ...data };
      rows.push(row);
      return row;
    }),
    deleteMany: vi.fn(async ({ where }: Row) => {
      const existing = rows.filter((row) => matches(row, where));
      for (const row of existing) {
        rows.splice(rows.indexOf(row), 1);
      }
      return { count: existing.length };
    }),
  });

  const settingsDelegate = createDelegate(settings);
  const windowDelegate = createDelegate(windows);
  const blockDelegate = createDelegate(blocks);
  const reservationDelegate = createDelegate(reservations);
  const outboxDelegate = createDelegate(outbox);

  const prisma = {
    listing: {
      findFirst: vi.fn(
        async ({ where }: Row) => listings.find((listing) => matches(listing, where)) ?? null,
      ),
    },
    listingBookingSettings: {
      ...settingsDelegate,
      upsert: vi.fn(async ({ where, create, update }: Row) => {
        const existing = settings.find((row) => matches(row, where));
        if (existing) {
          Object.assign(existing, update);
          return existing;
        }
        const created = {
          id: `60000000-0000-4000-8000-${String(nextId++).padStart(12, '0')}`,
          ...create,
        };
        settings.push(created);
        return created;
      }),
    },
    availabilityWindow: windowDelegate,
    availabilityBlock: blockDelegate,
    reservation: {
      ...reservationDelegate,
      findFirst: vi.fn(async ({ where, include }: Row) => {
        const reservation = reservations.find((row) => matches(row, where));
        if (!reservation) return null;
        if (!include?.listing) return reservation;
        const listing = listings.find((row) => row.id === reservation.listingId);
        return { ...reservation, listing: { ownerId: listing?.ownerId } };
      }),
      update: vi.fn(async ({ where, data }: Row) => {
        const reservation = reservations.find((row) => matches(row, where));
        if (!reservation) throw new Error('Reservation not found in e2e mock');
        Object.assign(reservation, data);
        return reservation;
      }),
      updateMany: vi.fn(async ({ where, data }: Row) => {
        const matching = reservations.filter((row) => matches(row, where));
        matching.forEach((row) => Object.assign(row, data));
        return { count: matching.length };
      }),
    },
    bookingOutboxEvent: outboxDelegate,
    $queryRaw: vi.fn().mockResolvedValue([]),
    $transaction: vi.fn(async (callback: (tx: PrismaService) => Promise<unknown>) =>
      callback(prisma as unknown as PrismaService),
    ),
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  };

  return { state: { reservations, outbox }, prisma };
}

describe('Booking reservations (e2e)', () => {
  let app: INestApplication<App>;
  let jwt: JwtService;
  let prismaMock: ReturnType<typeof createPrismaMock>;

  const issueToken = (sub: string, tenantId: string, role: string) =>
    jwt.sign({ sub, tenantId, role });
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  beforeEach(async () => {
    prismaMock = createPrismaMock();
    const moduleFixture = await Test.createTestingModule({
      imports: [
        BookingModule,
        PassportModule,
        JwtModule.register({
          secret: process.env.JWT_SECRET ?? 'dev-only-placeholder-secret',
          signOptions: { expiresIn: '1h' },
        }),
      ],
      providers: [JwtStrategy],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock.prisma)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    jwt = moduleFixture.get(JwtService);
  });

  afterEach(async () => {
    await app.close();
  });

  it('supports availability, reservation, provider decision, cancellation, and tenant isolation over HTTP', async () => {
    const providerA = issueToken(ids.providerA, ids.tenantA, 'PROVIDER');
    const clientA = issueToken(ids.clientA, ids.tenantA, 'CLIENT');
    const providerB = issueToken(ids.providerB, ids.tenantB, 'PROVIDER');
    const clientB = issueToken(ids.clientB, ids.tenantB, 'CLIENT');
    const start = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    start.setUTCHours(9, 0, 0, 0);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const startAt = start.toISOString().slice(0, 16);
    const endAt = end.toISOString().slice(0, 16);
    const localDate = startAt.slice(0, 10);

    await request(app.getHttpServer())
      .put(`/booking/listings/${ids.listingA}/settings`)
      .set(auth(providerA))
      .send({ timezoneId: 'UTC', bookingMode: 'REQUEST_APPROVAL', confirmationTimeHours: 12 })
      .expect(200)
      .expect(({ body }) => expect(body.bookingMode).toBe('REQUEST_APPROVAL'));

    await request(app.getHttpServer())
      .post(`/booking/listings/${ids.listingA}/availability/windows`)
      .set(auth(providerA))
      .send({ startAt, endAt })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/booking/listings/${ids.listingA}/availability`)
      .query({ startAt, endAt })
      .set(auth(clientA))
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          timezoneId: 'UTC',
          startAt: `${localDate}T09:00:00.000Z`,
          endAt: `${localDate}T11:00:00.000Z`,
          availableIntervals: [
            {
              startAt: `${localDate}T09:00:00.000Z`,
              endAt: `${localDate}T11:00:00.000Z`,
            },
          ],
        });
      });

    const reservationResponse = await request(app.getHttpServer())
      .post('/booking/reservations')
      .set(auth(clientA))
      .set('x-tenant-id', ids.tenantB)
      .send({
        listingId: ids.listingA,
        startAt,
        endAt,
        customerId: ids.clientB,
      })
      .expect(201);
    const reservationId = reservationResponse.body.id as string;
    expect(reservationResponse.body).toMatchObject({
      tenantId: ids.tenantA,
      customerId: ids.clientA,
      status: 'REQUESTED',
    });
    expect(prismaMock.state.reservations).toHaveLength(1);
    expect(prismaMock.state.reservations[0]).toMatchObject({
      tenantId: ids.tenantA,
      customerId: ids.clientA,
    });

    await request(app.getHttpServer())
      .get('/booking/reservations')
      .set(auth(clientA))
      .expect(200)
      .expect(({ body }) => expect(body.map((item: Row) => item.id)).toEqual([reservationId]));

    await request(app.getHttpServer())
      .post(`/booking/reservations/${reservationId}/accept`)
      .set(auth(providerA))
      .expect(201)
      .expect(({ body }) => expect(body.status).toBe('ACCEPTED_AWAITING_PAYMENT'));

    await request(app.getHttpServer())
      .post('/booking/reservations')
      .set(auth(clientA))
      .send({ listingId: ids.listingA, startAt, endAt })
      .expect(409);

    await request(app.getHttpServer())
      .post(`/booking/reservations/${reservationId}/cancel`)
      .set(auth(clientA))
      .send({ reason: 'Changed plans' })
      .expect(201)
      .expect(({ body }) => expect(body.status).toBe('CANCELLED'));
    expect(prismaMock.state.reservations[0]).toMatchObject({
      cancelledById: ids.clientA,
      cancellationReason: 'Changed plans',
    });

    await request(app.getHttpServer())
      .get(`/booking/listings/${ids.listingA}/availability`)
      .query({ startAt, endAt })
      .set(auth(clientA))
      .expect(200)
      .expect(({ body }) => expect(body.availableIntervals).toHaveLength(1));

    await request(app.getHttpServer())
      .get(`/booking/listings/${ids.listingA}/reservations`)
      .set(auth(providerB))
      .expect(404);
    await request(app.getHttpServer())
      .post(`/booking/reservations/${reservationId}/accept`)
      .set(auth(providerB))
      .expect(404);
    await request(app.getHttpServer())
      .post('/booking/reservations')
      .set(auth(clientB))
      .send({ listingId: ids.listingA, startAt, endAt })
      .expect(404);
    await request(app.getHttpServer())
      .get(`/booking/listings/${ids.listingA}/availability/windows`)
      .set(auth(providerB))
      .expect(404);
    await request(app.getHttpServer())
      .post(`/booking/listings/${ids.listingA}/availability/windows`)
      .set(auth(providerB))
      .send({ startAt, endAt })
      .expect(404);
    await request(app.getHttpServer())
      .get(`/booking/listings/${ids.listingA}/availability/blocks`)
      .set(auth(providerB))
      .expect(404);
    await request(app.getHttpServer())
      .post(`/booking/listings/${ids.listingA}/availability/blocks`)
      .set(auth(providerB))
      .send({ startAt, endAt, reason: 'cross-tenant attempt' })
      .expect(404);

    expect(prismaMock.state.outbox.map((event) => event.eventType)).toEqual([
      'RESERVATION_REQUESTED',
      'RESERVATION_ACCEPTED',
      'RESERVATION_CANCELLED',
    ]);
  });
});
