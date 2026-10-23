import { describe, expect, it, vi, beforeEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { DirectoryController } from './directory.controller.js';
import type { DirectoryService } from './directory.service.js';
import type { TenantRequest } from '../../common/middleware/tenant.middleware.js';

describe('DirectoryController', () => {
  let controller: DirectoryController;
  let mockDirectoryService: {
    getCategories: ReturnType<typeof vi.fn>;
    getCategoryBySlug: ReturnType<typeof vi.fn>;
    getListings: ReturnType<typeof vi.fn>;
    getListingById: ReturnType<typeof vi.fn>;
    createListing: ReturnType<typeof vi.fn>;
    updateListing: ReturnType<typeof vi.fn>;
    createPromotion: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockDirectoryService = {
      getCategories: vi.fn(),
      getCategoryBySlug: vi.fn(),
      getListings: vi.fn(),
      getListingById: vi.fn(),
      createListing: vi.fn(),
      updateListing: vi.fn(),
      createPromotion: vi.fn(),
    };

    controller = new DirectoryController(mockDirectoryService as unknown as DirectoryService);
  });

  describe('getCategories', () => {
    it('delegates to service.getCategories', async () => {
      mockDirectoryService.getCategories.mockResolvedValue([{ id: '1', name: 'Música' }]);
      const result = await controller.getCategories();
      expect(result).toEqual([{ id: '1', name: 'Música' }]);
    });
  });

  describe('getListings', () => {
    it('throws BadRequestException if tenant header is missing', async () => {
      const mockReq = { headers: {} } as TenantRequest;
      await expect(controller.getListings(mockReq, {})).rejects.toThrow(BadRequestException);
    });

    it('returns filtered listings when valid tenant provided', async () => {
      const mockReq = {
        tenantId: 'tenant-123',
        headers: {},
      } as TenantRequest;

      mockDirectoryService.getListings.mockResolvedValue({ items: [], meta: { total: 0 } });

      const result = await controller.getListings(mockReq, { city: 'Puebla', page: '1' });
      expect(result).toEqual({ items: [], meta: { total: 0 } });
      expect(mockDirectoryService.getListings).toHaveBeenCalledWith(
        'tenant-123',
        expect.objectContaining({
          city: 'Puebla',
          page: 1,
        }),
      );
    });
  });

  describe('createListing', () => {
    const ownerRequest = {
      tenantId: 'tenant-123',
      headers: {},
      user: { sub: 'owner-1', tenantId: 'tenant-123', role: 'OWNER' },
    } as unknown as TenantRequest;

    it('validates schema and rejects invalid payload', async () => {
      await expect(controller.createListing(ownerRequest, { title: 'No' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('uses the authenticated owner and tenant instead of client-supplied identity', async () => {
      const body = {
        ownerId: 'attacker-selected-user',
        categoryId: '00000000-0000-4000-8000-000000000001',
        subcategoryId: '00000000-0000-4000-8000-000000000002',
        title: 'Jardín para eventos',
        description: 'Espacio para eventos sociales y celebraciones.',
        city: 'Puebla',
        state: 'Puebla',
        basePrice: 25000,
      };
      mockDirectoryService.createListing.mockResolvedValue({ id: 'listing-1' });

      await expect(controller.createListing(ownerRequest, body)).resolves.toEqual({
        id: 'listing-1',
      });
      expect(mockDirectoryService.createListing).toHaveBeenCalledWith(
        'tenant-123',
        'owner-1',
        expect.not.objectContaining({ ownerId: 'attacker-selected-user' }),
      );
    });
  });
});
