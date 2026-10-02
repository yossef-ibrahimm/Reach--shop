/**
 * Listing URL state (D-030): `q`, `sort`, comma-joined multi-facets
 * (`category`, `brand`, `system`, `availability`) and dynamic spec facets
 * (`spec_<key>`). Page/load-more count is intentionally NOT in the URL —
 * it resets whenever the filter state changes.
 */

export type SortKey = 'featured' | 'name';

export type ListingState = {
  q: string;
  sort: SortKey;
  category: string[];
  brand: string[];
  system: string[];
  availability: string[];
  specs: Record<string, string[]>;
};

export const DEFAULT_SORT: SortKey = 'featured';
const SPEC_PREFIX = 'spec_';

export function emptyListingState(): ListingState {
  return {
    q: '',
    sort: DEFAULT_SORT,
    category: [],
    brand: [],
    system: [],
    availability: [],
    specs: {},
  };
}

function splitList(value: string | null): string[] {
  if (!value) return [];
  const items = value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  return [...new Set(items)];
}

export function parseListingState(params: URLSearchParams): ListingState {
  const specs: Record<string, string[]> = {};
  params.forEach((value, key) => {
    if (key.startsWith(SPEC_PREFIX)) {
      const specKey = key.slice(SPEC_PREFIX.length);
      if (specKey.length > 0) {
        specs[specKey] = splitList(value);
      }
    }
  });

  const sort = params.get('sort');
  return {
    q: params.get('q')?.trim() ?? '',
    sort: sort === 'name' ? 'name' : DEFAULT_SORT,
    category: splitList(params.get('category')),
    brand: splitList(params.get('brand')),
    system: splitList(params.get('system')),
    availability: splitList(params.get('availability')),
    specs,
  };
}

export function serializeListingState(state: ListingState): string {
  const params = new URLSearchParams();
  if (state.q) params.set('q', state.q);
  if (state.sort !== DEFAULT_SORT) params.set('sort', state.sort);
  if (state.category.length > 0) params.set('category', state.category.join(','));
  if (state.brand.length > 0) params.set('brand', state.brand.join(','));
  if (state.system.length > 0) params.set('system', state.system.join(','));
  if (state.availability.length > 0) {
    params.set('availability', state.availability.join(','));
  }
  for (const key of Object.keys(state.specs).sort()) {
    const values = state.specs[key];
    if (values.length > 0) params.set(`${SPEC_PREFIX}${key}`, values.join(','));
  }
  return params.toString();
}

/** True when any filter/search (i.e. anything but sort) is active. */
export function hasActiveFilters(state: ListingState): boolean {
  return (
    state.q.length > 0 ||
    state.category.length > 0 ||
    state.brand.length > 0 ||
    state.system.length > 0 ||
    state.availability.length > 0 ||
    Object.values(state.specs).some((values) => values.length > 0)
  );
}
