import { cn } from '@/lib/cn';

type Props = {
  eyebrow?: string;
  title: string;
  className?: string;
  action?: React.ReactNode;
  /** Heading level for a11y (home sections are h2 under the hero h1). */
  as?: 'h2' | 'h3';
};

export function SectionHeading({ eyebrow, title, className, action, as: Heading = 'h2' }: Props) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-4', className)}>
      <div>
        {eyebrow && <p className="text-fire-600 text-sm font-bold">{eyebrow}</p>}
        <Heading
          className={
            eyebrow ? 'mt-1 text-2xl font-bold lg:text-[28px]' : 'text-2xl font-bold lg:text-[28px]'
          }
        >
          {title}
        </Heading>
      </div>
      {action}
    </div>
  );
}
