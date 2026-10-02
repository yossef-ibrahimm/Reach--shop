/** WhatsApp / telephone link builders (PROJECT_SPEC §6.1). */

/**
 * `wa.me` link: E.164 without `+`, with a URL-encoded prefilled message.
 * Numbers are stored in E.164 (e.g. `+201000000000`), so stripping non-digits
 * yields the country-code-first, zero-free form wa.me expects.
 */
export function waLink(number: string, message: string): string {
  const digits = number.replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/** `tel:` link — keeps the E.164 form (`tel:+20…`). */
export function telLink(number: string): string {
  return `tel:${number}`;
}

/** Fills `{name}` / `{url}` placeholders in a localized message template. */
export function fillTemplate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}
