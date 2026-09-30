import clsx from 'clsx';
import { enumLabel } from '../../lib/format';

const TONES: Record<string, string> = {
  DESIGN: 'bg-amber-50 text-amber-800 ring-amber-200',
  PRODUCTION: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  ASSEMBLY: 'bg-slate-50 text-slate-700 ring-slate-200',
  FINISHED: 'bg-blue-50 text-blue-800 ring-blue-200',
};

/** Subtle pill for enum values (type, lifecycle phase). */
export function Badge({ value }: { value: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        TONES[value] ?? 'bg-gray-50 text-gray-700 ring-gray-200',
      )}
    >
      {enumLabel(value)}
    </span>
  );
}
