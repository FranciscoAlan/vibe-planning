export type ListingStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'SUSPENDED' | 'ARCHIVED';

export type PriceUnit = 'PER_EVENT' | 'PER_HOUR' | 'PER_PERSON' | 'PER_DAY';

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export interface ISubcategory {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  subcategories?: ISubcategory[];
}

export interface IListingMedia {
  id: string;
  listingId: string;
  url: string;
  publicId: string;
  mediaType: string;
  sortOrder: number;
  isCover: boolean;
  createdAt: Date;
}

export interface IListingPromotion {
  id: string;
  listingId: string;
  title: string;
  description?: string | null;
  code?: string | null;
  discountType: DiscountType;
  discountValue: number | string;
  startDate: Date | string;
  endDate: Date | string;
  maxRedemptions?: number | null;
  redemptionCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPricingPackage {
  name: string;
  price: number;
  description?: string;
  features?: string[];
}

export interface IPricingRules {
  weekendSurchargePercentage?: number;
  holidaySurchargePercentage?: number;
  seasonalMultipliers?: Record<string, number>;
  packages?: IPricingPackage[];
  customRules?: Record<string, unknown>;
}

export interface IListing {
  id: string;
  tenantId: string;
  ownerId: string;
  categoryId: string;
  subcategoryId: string;
  title: string;
  slug: string;
  description: string;
  status: ListingStatus;

  // Ubicación y cobertura
  city: string;
  state: string;
  country: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;

  // Precios
  basePrice: number | string;
  currency: string;
  priceUnit: PriceUnit;
  pricingRules?: IPricingRules | null;

  // Logística
  minGuests?: number | null;
  maxGuests?: number | null;
  leadTimeHours: number;
  cancellationPolicy?: string | null;
  serviceRules?: string | null;

  createdAt: Date;
  updatedAt: Date;

  category?: ICategory;
  subcategory?: ISubcategory;
  media?: IListingMedia[];
  promotions?: IListingPromotion[];
}
