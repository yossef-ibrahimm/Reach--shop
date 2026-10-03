import Image from 'next/image';
import { SITE_LOGO } from '@/lib/content/site-logo';
import { cn } from '@/lib/cn';

type Props = {
  /** Accessible name. Adjacent to a visible company name, pass `''` (decorative). */
  readonly alt: string;
  /** Rendered height in pixels; the width follows the logo's intrinsic ratio. */
  readonly height?: number;
  readonly className?: string;
  /** Above-the-fold logos should set this to avoid layout shuffle on hydration. */
  readonly priority?: boolean;
};

/**
 * Company logo. Replaces the former inline `Flame` icon placeholder, so the real
 * mark is used everywhere the brand appears.
 *
 * The mark is dark (`rgb(17,100,148)`), so it needs a light background. On dark
 * surfaces wrap it in a light chip rather than inverting the file — see D-059.
 */
export function SiteLogo({ alt, height = 40, className, priority = false }: Props) {
  const width = Math.round((SITE_LOGO.width / SITE_LOGO.height) * height);

  return (
    <Image
      src={SITE_LOGO.src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={cn('shrink-0 object-contain', className)}
    />
  );
}