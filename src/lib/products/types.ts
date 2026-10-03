import type { Json, Tables } from '@/lib/supabase/database.types';

/** Bilingual name pair helper. */
export type LocalizedName = { name_ar: string; name_en: string };

export type SlugName = LocalizedName & { id: string; slug: string };

export type CertificateData = Tables<'certificates'>;
export type ProjectData = Tables<'projects'>;

export type CardImage = {
  id: string;
  url: string;
  thumb_url: string | null;
  alt_ar: string | null;
  alt_en: string | null;
};

/**
 * Product shape baked into the static pages and passed to client components
 * (filters/search run client-side per PROJECT_SPEC §6.3).
 */
export type ProductCardData = {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  system_type: string | null;
  is_featured: boolean;
  sort_order: number;
  specs: Json;
  search_keywords: string | null;
  catalog_ar_url: string | null;
  catalog_en_url: string | null;
  brand: SlugName | null;
  category: SlugName | null;
  series: SlugName | null;
  images: CardImage[];
};

export type SpecDefinition = {
  id: string;
  key: string;
  label_ar: string;
  label_en: string;
  value_type: string;
  unit: string | null;
  is_filterable: boolean;
  sort_order: number;
  options: Json;
  category_slug: string;
};

export type CategoryData = SlugName & { sort_order: number };
export type BrandData = SlugName & { sort_order: number; logo_url: string | null };
