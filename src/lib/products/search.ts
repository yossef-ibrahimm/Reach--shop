import MiniSearch from 'minisearch';
import type { ProductCardData } from './types';

/**
 * Arabic search normalization (PROJECT_SPEC §6.3): strip tashkeel + tatweel,
 * أإآٱ → ا, ة → ه, ى → ي, normalize Arabic-Indic/Persian digits to Western,
 * lowercase Latin. Applied identically at index time and query time so the
 * two forms always meet.
 */
export function normalizeArabic(input: string): string {
  return input
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '') // tashkeel/harakat + tatweel
    .replace(/[\u0623\u0625\u0622\u0671]/g, '\u0627') // أ إ آ ٱ → ا
    .replace(/\u0629/g, '\u0647') // ة → ه
    .replace(/\u0649/g, '\u064A') // ى → ي
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .toLowerCase()
    .trim();
}

type SearchDoc = {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  brand: string;
  category: string;
  series: string;
  keywords: string;
};

/**
 * Client-side search over the baked product list (PROJECT_SPEC §6.3):
 * one index over AR + EN names, descriptions, brand, category, series and
 * `search_keywords`, tolerant of typos (fuzzy) and missing words (prefix).
 */
export function buildProductSearch(products: ProductCardData[]): MiniSearch<SearchDoc> {
  const index = new MiniSearch<SearchDoc>({
    fields: [
      'name_ar',
      'name_en',
      'description_ar',
      'description_en',
      'brand',
      'category',
      'series',
      'keywords',
    ],
    storeFields: ['id'],
    processTerm: (term) => {
      const normalized = normalizeArabic(term);
      return normalized.length > 0 ? normalized : null;
    },
    searchOptions: {
      fuzzy: 0.25,
      prefix: true,
      combineWith: 'AND',
    },
  });

  index.addAll(
    products.map((product) => ({
      id: product.id,
      name_ar: product.name_ar,
      name_en: product.name_en,
      description_ar: product.description_ar ?? '',
      description_en: product.description_en ?? '',
      brand: product.brand?.name_ar ?? '',
      category: product.category?.name_ar ?? '',
      series: product.series?.name_ar ?? '',
      keywords: product.search_keywords ?? '',
    })),
  );

  return index;
}

/** Runs a normalized search and returns the matching product ids. */
export function searchProductIds(index: MiniSearch<SearchDoc>, query: string): Set<string> {
  const normalized = normalizeArabic(query);
  if (normalized.length === 0) return new Set();
  const results = index.search(normalized);
  return new Set(results.map((result) => String(result.id)));
}
