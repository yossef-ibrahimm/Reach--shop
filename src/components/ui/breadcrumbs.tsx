import { Fragment } from 'react';
import { Link } from '@/lib/i18n/navigation';

export type Crumb = { label: string; href?: string };

type Props = {
  items: Crumb[];
  label: string;
};

/** Breadcrumbs (PROJECT_SPEC §6.4) — `nav` landmark, last item is current page. */
export function Breadcrumbs({ items, label }: Props) {
  return (
    <nav aria-label={label} className="text-muted overflow-x-auto">
      <ol className="flex items-center gap-2 text-sm whitespace-nowrap">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <Fragment key={`${item.label}-${index}`}>
              {index > 0 && (
                <li aria-hidden="true" className="text-slate-400">
                  /
                </li>
              )}
              <li>
                {item.href && !last ? (
                  <Link
                    href={item.href}
                    className="hover:text-fire-600 font-medium transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    aria-current={last ? 'page' : undefined}
                    className="text-text font-semibold"
                  >
                    {item.label}
                  </span>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
