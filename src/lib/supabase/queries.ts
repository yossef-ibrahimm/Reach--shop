import 'server-only';
import { cache } from 'react';
import { supabase } from './server';
import type { Tables } from './database.types';
import type {
  BrandData,
  CategoryData,
  ProductCardData,
  SpecDefinition,
} from '@/lib/products/types';

/* ---------------------------------------------------------------- rows --- */

export type SiteSettingsRow = Tables<'site_settings'>;
export type ContactNumberRow = Tables<'contact_numbers'>;
export type SocialLinkRow = Tables<'social_links'>;
export type CertificateRow = Tables<'certificates'>;
export type ProjectRow = Tables<'projects'>;

/* ---------------------------------------------------------------- site --- */

export type SiteData = {
  settings: Record<string, { ar: string; en: string }>;
  phones: ContactNumberRow[];
  socials: SocialLinkRow[];
};

/** Locale-aware setting lookup with an empty-string fallback. */
export function setting(site: SiteData, key: string, locale: string): string {
  const value = site.settings[key];
  if (!value) return '';
  return value[locale === 'en' ? 'en' : 'ar'] || value.ar || value.en || '';
}

function must<T>(data: T | null, error: { message: string } | null, label: string): T {
  if (error) {
    throw new Error(`[supabase] ${label} failed: ${error.message}`);
  }
  if (data === null) {
    throw new Error(`[supabase] ${label} returned no data`);
  }
  return data;
}

/* ---------------------------------------------------------------- site --- */

export const getSiteData = cache(async (): Promise<SiteData> => {
  const [settings, phones, socials] = await Promise.all([
    supabase.from('site_settings').select('key, value_ar, value_en'),
    supabase.from('contact_numbers').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('social_links').select('*').eq('is_active', true).order('sort_order'),
  ]);

  const settingsRows = must(settings.data, settings.error, 'site_settings');
  const phoneRows = must(phones.data, phones.error, 'contact_numbers');
  const socialRows = must(socials.data, socials.error, 'social_links');

  const map: SiteData['settings'] = {};
  for (const row of settingsRows) {
    map[row.key] = { ar: row.value_ar ?? '', en: row.value_en ?? '' };
  }

  return { settings: map, phones: phoneRows, socials: socialRows };
});

/** The WhatsApp number: first active row flagged as WhatsApp, else the first row. */
export function whatsappNumber(site: SiteData): string | null {
  const number = site.phones.find((phone) => phone.is_whatsapp) ?? site.phones[0];
  return number?.number ?? null;
}

/* ------------------------------------------------------------ products --- */

const PRODUCT_SELECT = `
  id, slug, name_ar, name_en, description_ar, description_en,
  availability, system_type, is_featured, sort_order, specs,
  search_keywords, catalog_ar_url, catalog_en_url,
  brand:brands(id, slug, name_ar, name_en),
  category:categories(id, slug, name_ar, name_en),
  series:series(id, slug, name_ar, name_en),
  images:product_images(id, url, thumb_url, alt_ar, alt_en, sort_order)
`;

type SlugEntity = { id: string; slug: string; name_ar: string; name_en: string };

type ProductJoinRow = {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  availability: string;
  system_type: string | null;
  is_featured: boolean;
  sort_order: number;
  specs: Tables<'products'>['specs'];
  search_keywords: string | null;
  catalog_ar_url: string | null;
  catalog_en_url: string | null;
  brand: SlugEntity | null;
  category: SlugEntity | null;
  series: SlugEntity | null;
  images: Array<{
    id: string;
    url: string;
    thumb_url: string | null;
    alt_ar: string | null;
    alt_en: string | null;
    sort_order: number;
  }>;
};

function toCardProduct(row: ProductJoinRow): ProductCardData {
  const pick = (entity: SlugEntity | null) =>
    entity
      ? { id: entity.id, slug: entity.slug, name_ar: entity.name_ar, name_en: entity.name_en }
      : null;

  return {
    id: row.id,
    slug: row.slug,
    name_ar: row.name_ar,
    name_en: row.name_en,
    description_ar: row.description_ar,
    description_en: row.description_en,
    availability: row.availability,
    system_type: row.system_type,
    is_featured: row.is_featured,
    sort_order: row.sort_order,
    specs: row.specs,
    search_keywords: row.search_keywords,
    catalog_ar_url: row.catalog_ar_url,
    catalog_en_url: row.catalog_en_url,
    brand: pick(row.brand),
    category: pick(row.category),
    series: pick(row.series),
    images: (row.images ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(({ id, url, thumb_url, alt_ar, alt_en }) => ({
        id,
        url,
        thumb_url,
        alt_ar,
        alt_en,
      })),
  };
}

type ProductFetchOptions = {
  featured?: boolean;
  slug?: string;
  seriesId?: string;
  categoryId?: string;
  excludeId?: string;
  limit?: number;
};

/** Filters first, then ordering — supabase builders only allow `.order()` last. */
async function fetchProductRows(options: ProductFetchOptions = {}): Promise<ProductCardData[]> {
  let query = supabase.from('products').select(PRODUCT_SELECT).eq('is_published', true);
  if (options.featured) query = query.eq('is_featured', true);
  if (options.slug) query = query.eq('slug', options.slug);
  if (options.seriesId) query = query.eq('series_id', options.seriesId);
  if (options.categoryId) query = query.eq('category_id', options.categoryId);
  if (options.excludeId) query = query.neq('id', options.excludeId);

  const ordered = query
    .order('is_featured', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('sort_order', { referencedTable: 'product_images', ascending: true });

  const result = await (options.limit === undefined ? ordered : ordered.limit(options.limit));
  const rows = must(result.data as unknown as ProductJoinRow[], result.error, 'products');
  return rows.map(toCardProduct);
}

/** All published products, catalog order with featured first (D-037). */
export const getAllProducts = cache(async (): Promise<ProductCardData[]> => fetchProductRows());

export const getFeaturedProducts = cache(async (limit = 8): Promise<ProductCardData[]> =>
  fetchProductRows({ featured: true, limit }),
);

export const getProductBySlug = cache(async (slug: string): Promise<ProductCardData | null> => {
  const rows = await fetchProductRows({ slug });
  return rows[0] ?? null;
});

/**
 * Related products (PROJECT_SPEC §6.4): same series first, then same category,
 * excluding the product itself.
 */
export const getRelatedProducts = cache(
  async (product: ProductCardData, limit = 4): Promise<ProductCardData[]> => {
    const related: ProductCardData[] = [];
    const seen = new Set<string>([product.id]);

    if (product.series) {
      const rows = await fetchProductRows({
        seriesId: product.series.id,
        excludeId: product.id,
        limit,
      });
      for (const row of rows) {
        if (!seen.has(row.id)) {
          seen.add(row.id);
          related.push(row);
        }
      }
    }

    if (related.length < limit && product.category) {
      const rows = await fetchProductRows({
        categoryId: product.category.id,
        excludeId: product.id,
        limit: limit - related.length,
      });
      for (const row of rows) {
        if (!seen.has(row.id)) {
          seen.add(row.id);
          related.push(row);
        }
      }
    }

    return related;
  },
);

/* -------------------------------------------------------- catalog data --- */

export const getCategories = cache(async (): Promise<CategoryData[]> => {
  const query = await supabase
    .from('categories')
    .select('id, slug, name_ar, name_en, sort_order')
    .order('sort_order');
  const rows = must(query.data, query.error, 'categories');
  return rows;
});

/** Published-product count per category (real data — never invented). */
export const getCategoryCounts = cache(
  async (): Promise<Array<{ category: CategoryData; count: number }>> => {
    const [categories, products] = await Promise.all([
      supabase
        .from('categories')
        .select('id, slug, name_ar, name_en, sort_order')
        .order('sort_order'),
      supabase.from('products').select('category_id').eq('is_published', true),
    ]);
    const categoryRows = must(categories.data, categories.error, 'categories');
    const productRows = must(products.data, products.error, 'product counts');

    const counts = new Map<string, number>();
    for (const product of productRows) {
      counts.set(product.category_id, (counts.get(product.category_id) ?? 0) + 1);
    }

    return categoryRows.map(({ id, slug, name_ar, name_en, sort_order }) => ({
      category: { id, slug, name_ar, name_en, sort_order },
      count: counts.get(id) ?? 0,
    }));
  },
);

export const getBrands = cache(async (): Promise<BrandData[]> => {
  const query = await supabase
    .from('brands')
    .select('id, slug, name_ar, name_en, logo_url, sort_order')
    .order('sort_order');
  const rows = must(query.data, query.error, 'brands');
  return rows;
});

export const getCertificates = cache(async (): Promise<CertificateRow[]> => {
  const query = await supabase
    .from('certificates')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  const rows = must(query.data, query.error, 'certificates');
  return rows;
});

export const getProjects = cache(async (): Promise<ProjectRow[]> => {
  const query = await supabase
    .from('projects')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  const rows = must(query.data, query.error, 'projects');
  return rows;
});

/** Spec definitions joined with their category slug (for filters + specs table). */
export const getSpecDefinitions = cache(async (): Promise<SpecDefinition[]> => {
  const query = await supabase
    .from('spec_definitions')
    .select(
      'id, key, label_ar, label_en, value_type, unit, is_filterable, sort_order, options, category:categories(slug)',
    )
    .order('category_id')
    .order('sort_order');
  const rows = must(
    query.data as unknown as Array<
      Omit<SpecDefinition, 'category_slug'> & { category: { slug: string } | null }
    >,
    query.error,
    'spec_definitions',
  );

  return rows.map(({ category, ...rest }) => ({
    ...rest,
    category_slug: category?.slug ?? '',
  }));
});
