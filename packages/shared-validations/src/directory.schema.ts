import { z } from 'zod';

export const listingStatusEnum = z.enum([
  'DRAFT',
  'PENDING_REVIEW',
  'PUBLISHED',
  'SUSPENDED',
  'ARCHIVED',
]);

export const priceUnitEnum = z.enum(['PER_EVENT', 'PER_HOUR', 'PER_PERSON', 'PER_DAY']);

export const discountTypeEnum = z.enum(['PERCENTAGE', 'FIXED_AMOUNT']);

export const pricingPackageSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.number().positive(),
  description: z.string().max(500).optional(),
  features: z.array(z.string()).optional(),
});

export const pricingRulesSchema = z.object({
  weekendSurchargePercentage: z.number().min(0).max(200).optional(),
  holidaySurchargePercentage: z.number().min(0).max(200).optional(),
  seasonalMultipliers: z.record(z.string(), z.number().positive()).optional(),
  packages: z.array(pricingPackageSchema).optional(),
  customRules: z.record(z.string(), z.unknown()).optional(),
});

export const listingMediaSchema = z.object({
  url: z.string().url(),
  publicId: z.string().min(1),
  mediaType: z.string().default('image'),
  sortOrder: z.number().int().min(0).default(0),
  isCover: z.boolean().default(false),
});

export const createPromotionSchema = z
  .object({
    title: z.string().min(3).max(120),
    description: z.string().max(500).optional(),
    code: z
      .string()
      .min(3)
      .max(30)
      .regex(/^[A-Z0-9_-]+$/, 'Code must be alphanumeric')
      .optional(),
    discountType: discountTypeEnum.default('PERCENTAGE'),
    discountValue: z.number().positive(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    maxRedemptions: z.number().int().positive().optional(),
    isActive: z.boolean().default(true),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'endDate must be after startDate',
    path: ['endDate'],
  });

export const createListingSchema = z.object({
  categoryId: z.string().uuid(),
  subcategoryId: z.string().uuid(),
  title: z.string().min(3).max(150),
  description: z.string().min(10).max(5000),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  country: z.string().length(3).default('MEX'),
  address: z.string().max(250).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  basePrice: z.number().positive(),
  currency: z.string().length(3).default('MXN'),
  priceUnit: priceUnitEnum.default('PER_EVENT'),
  pricingRules: pricingRulesSchema.optional(),
  minGuests: z.number().int().positive().optional(),
  maxGuests: z.number().int().positive().optional(),
  leadTimeHours: z.number().int().min(0).default(48),
  cancellationPolicy: z.string().max(1000).optional(),
  serviceRules: z.string().max(2000).optional(),
  media: z.array(listingMediaSchema).optional(),
});

export const updateListingSchema = createListingSchema.partial().extend({
  status: listingStatusEnum.optional(),
});

export const listingFilterSchema = z.object({
  categoryId: z.string().uuid().optional(),
  subcategoryId: z.string().uuid().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().positive().optional(),
  status: listingStatusEnum.optional().default('PUBLISHED'),
  hasPromotions: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type ListingFilterInput = z.infer<typeof listingFilterSchema>;
export type CreatePromotionInput = z.infer<typeof createPromotionSchema>;
