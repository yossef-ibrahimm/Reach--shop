import { Cairo, Inter, JetBrains_Mono } from 'next/font/google';

/**
 * Design-system fonts (docs/DESIGN.md §3).
 * - Cairo: Arabic (400/600/700/800)
 * - Inter: English (400/500/600/700)
 * - JetBrains Mono: specs, codes, phone numbers (500)
 */
export const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
  weight: ['400', '600', '700', '800'],
});

export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
  weight: '500',
});

/** CSS-variable classes to put on <html> (or any element) so CSS can pick the family. */
export const fontVariables = [cairo.variable, inter.variable, jetbrains.variable].join(' ');
