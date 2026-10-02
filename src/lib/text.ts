/**
 * Splits admin-authored text on `*emphasis*` markers (D-035).
 * Used for `site_settings.hero_title`: `حماية تبدأ *بالإنذار المبكر* لكل منشأة`
 * renders with the marked run inside `<em>`.
 */
export type HighlightPart = { text: string; em: boolean };

export function splitHighlight(text: string): HighlightPart[] {
  const parts = text.split('*');
  return parts
    .map((chunk, index) => ({ text: chunk, em: index % 2 === 1 }))
    .filter((part) => part.text.length > 0);
}
