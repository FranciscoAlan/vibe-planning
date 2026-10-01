import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import type {
  CreateListingInput,
  UpdateListingInput,
  ListingFilterInput,
  CreatePromotionInput,
} from '@vibe-planners/shared-validations';
import type { Prisma } from '@vibe-planners/database';

@Injectable()
export class DirectoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getCategories() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        subcategories: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async getCategoryBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        subcategories: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with slug '${slug}' not found`);
    }

    return category;
  }

  async getListings(tenantId: string, filters: ListingFilterInput) {
    const {
      categoryId,
      subcategoryId,
      city,
      state,
      minPrice,
      maxPrice,
      status,
      hasPromotions,
      page = 1,
      limit = 20,
    } = filters;

    const skip = (page - 1) * limit;

    const where: Prisma.ListingWhereInput = {
      tenantId,
      ...(status ? { status } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(subcategoryId ? { subcategoryId } : {}),
      ...(city ? { city: { contains: city, mode: 'insensitive' } } : {}),
      ...(state ? { state: { contains: state, mode: 'insensitive' } } : {}),
      ...(minPrice !== undefined || maxPrice !== undefined
        ? {
            basePrice: {
              ...(minPrice !== undefined ? { gte: minPrice } : {}),
              ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
            },
          }
        : {}),
      ...(hasPromotions
        ? {
            promotions: {
              some: {
                isActive: true,
                endDate: { gte: new Date() },
              },
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          subcategory: { select: { id: true, name: true, slug: true } },
          media: {
            orderBy: { sortOrder: 'asc' },
            take: 5,
          },
          promotions: {
            where: {
              isActive: true,
              endDate: { gte: new Date() },
            },
            take: 3,
          },
        },
      }),
      this.prisma.listing.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getListingById(id: string, tenantId: string) {
    const listing = await this.prisma.listing.findFirst({
      where: { id, tenantId },
      include: {
        category: true,
        subcategory: true,
        media: { orderBy: { sortOrder: 'asc' } },
        promotions: {
          where: {
            isActive: true,
            endDate: { gte: new Date() },
          },
        },
        owner: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException(`Listing with id '${id}' not found`);
    }

    return listing;
  }

  async createListing(tenantId: string, ownerId: string, data: CreateListingInput) {
    const { media, pricingRules, ...listingData } = data;

    // Generate unique slug within tenant
    const baseSlug = listingData.title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const slug = `${baseSlug}-${randomSuffix}`;

    return this.prisma.listing.create({
      data: {
        ...listingData,
        slug,
        tenantId,
        ownerId,
        ...(pricingRules ? { pricingRules: pricingRules as unknown as Prisma.InputJsonValue } : {}),
        ...(media && media.length > 0
          ? {
              media: {
                createMany: {
                  data: media.map((m, idx) => ({
                    url: m.url,
                    publicId: m.publicId,
                    mediaType: m.mediaType,
                    sortOrder: m.sortOrder ?? idx,
                    isCover: m.isCover ?? idx === 0,
                  })),
                },
              },
            }
          : {}),
      },
      include: {
        category: true,
        subcategory: true,
        media: true,
      },
    });
  }

  async updateListing(id: string, tenantId: string, data: UpdateListingInput) {
    await this.getListingById(id, tenantId);

    const { media: _media, pricingRules, ...updateData } = data;

    return this.prisma.listing.update({
      where: { id },
      data: {
        ...updateData,
        ...(pricingRules !== undefined
          ? { pricingRules: pricingRules as unknown as Prisma.InputJsonValue }
          : {}),
      },
      include: {
        category: true,
        subcategory: true,
        media: true,
        promotions: true,
      },
    });
  }

  async createPromotion(listingId: string, tenantId: string, data: CreatePromotionInput) {
    await this.getListingById(listingId, tenantId);

    return this.prisma.listingPromotion.create({
      data: {
        ...data,
        listingId,
      },
    });
  }
}
