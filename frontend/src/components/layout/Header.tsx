import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  title: string;
  subtitle?: string;
  /** Where the ← arrow goes; no arrow when omitted (e.g. Dashboard). */
  backTo?: string;
  backLabel?: string;
  /** Right-aligned header actions (e.g. Edit on a details page). */
  actions?: ReactNode;
}

/** Page header: "← Title" with the back arrow beside the title, muted subtitle below. */
export function Header({ title, subtitle, backTo, backLabel = 'Back', actions }: Props) {
  return (
    <header className="flex items-start justify-between gap-4 border-b border-line bg-white px-8 pb-5 pt-6">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {backTo && (
            <Link
              to={backTo}
              aria-label={backLabel}
              title={backLabel}
              className="-ml-1.5 rounded p-1 text-muted hover:bg-toolbar hover:text-ink"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden />
            </Link>
          )}
          <h1 className="truncate text-2xl font-semibold text-ink">{title}</h1>
        </div>
        {subtitle && <p className="mt-1 text-[15px] text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
