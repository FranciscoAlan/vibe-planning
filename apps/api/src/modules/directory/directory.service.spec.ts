import { describe, expect, it, vi, beforeEach } from 'vitest';
import { DirectoryService } from './directory.service.js';
import type { PrismaService } from '../../common/prisma/prisma.service.js';

describe('DirectoryService', () => {
  let service: DirectoryService;
  let mockPrisma: {
    category: { findMany: ReturnType<typeof vi.fn>; findUnique: ReturnType<typeof vi.fn> };
    listing: {
      findMany: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    listingPromotion: { create: ReturnType<typeof vi.fn> };
  };

  beforeEach(() => {
    mockPrisma = {
      category: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
      },
      listing: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      listingPromotion: {
        create: vi.fn(),
      },
    };

    service = new DirectoryService(mockPrisma as unknown as PrismaService);
  });

  describe('getCategories', () => {
    it('returns categories ordered with active subcategories', async () => {
      const mockCategories = [
        {
          id: 'cat-1',
          name: 'Locales y Espacios',
          slug: 'locales-y-espacios',
          subcategories: [{ id: 'sub-1', name: 'Salones' }],
        },
      ];
      mockPrisma.category.findMany.mockResolvedValue(mockCategories);

      const result = await service.getCategories();
      expect(result).toEqual(mockCategories);
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          subcategories: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
          },
        },
      });
    });
  });

  describe('getListings', () => {
    it('returns paginated listings with metadata', async () => {
      const mockListings = [
        {
          id: 'list-1',
          title: 'Hacienda San José',
          basePrice: '15000.00',
          city: 'Guadalajara',
        },
      ];
      mockPrisma.listing.findMany.mockResolvedValue(mockListings);
      mockPrisma.listing.count.mockResolvedValue(1);

      const result = await service.getListings('tenant-1', {
        page: 1,
        limit: 10,
        city: 'Guadalajara',
      });

      expect(result.items).toEqual(mockListings);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      expect(mockPrisma.listing.findMany).toHaveBeenCalled();
      expect(mockPrisma.listing.count).toHaveBeenCalled();
    });
  });

  describe('createListing', () => {
    it('generates a slug and creates a listing with media', async () => {
      const input = {
        categoryId: '00000000-0000-0000-0000-000000000001',
        subcategoryId: '00000000-0000-0000-0000-000000000002',
        title: 'Banda Los Alegres',
        description: 'Música en vivo para bodas y graduaciones',
        city: 'Monterrey',
        state: 'Nuevo León',
        country: 'MEX',
        basePrice: 25000,
        currency: 'MXN',
        priceUnit: 'PER_EVENT' as const,
        leadTimeHours: 48,
        media: [
          {
            url: 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg',
            publicId: 'sample',
            mediaType: 'image',
            sortOrder: 0,
            isCover: true,
          },
        ],
      };

      const mockCreated = { id: 'list-123', ...input, slug: 'banda-los-alegres-abc12' };
      mockPrisma.listing.create.mockResolvedValue(mockCreated);

      const result = await service.createListing('tenant-1', 'owner-1', input);
      expect(result).toEqual(mockCreated);
      expect(mockPrisma.listing.create).toHaveBeenCalled();
    });
  });

  describe('createPromotion', () => {
    it('verifies listing existence and creates promotion', async () => {
      mockPrisma.listing.findFirst.mockResolvedValue({ id: 'list-1' });
      const mockPromo = {
        id: 'promo-1',
        listingId: 'list-1',
        title: 'Descuento Buen Fin',
        discountType: 'PERCENTAGE',
        discountValue: '15.00',
      };
      mockPrisma.listingPromotion.create.mockResolvedValue(mockPromo);

      const promoInput = {
        title: 'Descuento Buen Fin',
        discountType: 'PERCENTAGE' as const,
        discountValue: 15,
        startDate: new Date('2026-11-15'),
        endDate: new Date('2026-11-20'),
        isActive: true,
      };

      const result = await service.createPromotion('list-1', 'tenant-1', promoInput);
      expect(result).toEqual(mockPromo);
      expect(mockPrisma.listingPromotion.create).toHaveBeenCalledWith({
        data: {
          ...promoInput,
          listingId: 'list-1',
        },
      });
    });
  });
});
