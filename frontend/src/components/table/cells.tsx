import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { EMPTY, dash } from '../../lib/format';

/** Blue identifier link, as in the reference tables. Use `to` for navigation, `onClick` for actions. */
export function LinkCell({ children, to, onClick }: { children: ReactNode; to?: string; onClick?: () => void }) {
  const className = 'text-left text-link hover:underline';
  if (to) {
    return (
      <Link to={to} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}

/** Text or a muted em dash when empty. */
export function TextCell({ value, wrap = false }: { value: string | null | undefined; wrap?: boolean }) {
  const text = dash(value);
  if (text === EMPTY) return <span className="text-muted">{EMPTY}</span>;
  return <span className={wrap ? 'line-clamp-2 max-w-xl' : undefined}>{text}</span>;
}

/** Details-card value: text or a muted, non-bold em dash. */
export function DetailValue({ value }: { value: string | null | undefined }) {
  const text = dash(value);
  if (text === EMPTY) return <span className="font-normal text-muted">{EMPTY}</span>;
  return <>{text}</>;
}
