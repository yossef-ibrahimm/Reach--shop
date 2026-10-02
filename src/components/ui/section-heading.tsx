import { cn } from '@/lib/cn';

type Props = {
  eyebrow?: string;
  title: string;
  className?: string;
  action?: React.ReactNode;
  /** Heading level for a11y (home sections are h2 under the hero h1). */
  as?: 'h2' | 'h3';
  /** Id for `aria-labelledby` on the owning <section>. */
  id?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  className,
  action,
  as: Heading = 'h2',
  id,
}: Props) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-4', className)}>
      <div>
        {eyebrow && (
          <p className="text-fire-600 text-[11px] font-black tracking-[0.12em] uppercase">
            {eyebrow}
          </p>
        )}
        <Heading
          id={id}
          className={
            eyebrow
              ? 'mt-2 text-2xl font-extrabold tracking-[-0.04em] lg:text-[32px]'
              : 'text-2xl font-extrabold tracking-[-0.04em] lg:text-[32px]'
          }
        >
          {title}
        </Heading>
      </div>
      {action}
    </div>
  );
}
