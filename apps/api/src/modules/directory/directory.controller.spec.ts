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
    it('validates schema and rejects invalid payload', async () => {
      const mockReq = {
        tenantId: 'tenant-123',
        headers: { 'x-user-id': 'user-1' },
      } as unknown as TenantRequest;

      // Missing required fields
      await expect(controller.createListing(mockReq, { title: 'No' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
