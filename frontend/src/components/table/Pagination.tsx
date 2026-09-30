import clsx from 'clsx';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { formatNumber } from '../../lib/format';
import { PAGE_SIZES } from '../../hooks/useTableParams';

/**
 * Page buttons to show (1-based) with '…' gaps: always first and last page,
 * plus current ±1. e.g. current 1 of 97 -> 1 2 3 … 97
 */
export function pageItems(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (current >= total - 2) [total - 3, total - 2, total - 1].forEach((p) => pages.add(p));
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result: (number | '…')[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push('…');
    result.push(p);
  });
  return result;
}

interface Props {
  page: number; // 0-based
  size: number;
  totalElements: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
}

/** Table footer: range, rows-per-page, go-to-page, page buttons. */
export function Pagination({ page, size, totalElements, totalPages, onPageChange, onSizeChange }: Props) {
  const [goTo, setGoTo] = useState('');
  const from = totalElements === 0 ? 0 : page * size + 1;
  const to = Math.min((page + 1) * size, totalElements);
  const current = page + 1;

  const submitGoTo = (e: FormEvent) => {
    e.preventDefault();
    const n = Number(goTo);
    if (Number.isInteger(n) && n >= 1 && n <= totalPages) onPageChange(n - 1);
    setGoTo('');
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-toolbar px-8 py-2 text-sm">
      <div className="flex items-center gap-4">
        <span>
          <span className="font-semibold">
            {from}–{to}
          </span>{' '}
          <span className="text-muted">of</span> <span className="font-semibold">{formatNumber(totalElements)}</span>
        </span>
        <label className="flex items-center gap-2 text-muted">
          Rows
          <span className="relative">
            <select
              value={size}
              onChange={(e) => onSizeChange(Number(e.target.value))}
              className="h-8 appearance-none rounded border border-line bg-white pl-2 pr-7 text-sm text-ink"
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2" aria-hidden />
          </span>
        </label>
      </div>

      <nav className="flex items-center gap-1" aria-label="Pagination">
        {totalPages > 7 && (
          <form onSubmit={submitGoTo} className="mr-3 flex items-center gap-2 text-muted">
            <label htmlFor="goto-page">Go to page</label>
            <input
              id="goto-page"
              value={goTo}
              onChange={(e) => setGoTo(e.target.value.replace(/\D/g, ''))}
              placeholder="#"
              className="h-8 w-14 rounded border border-line bg-white px-2 text-center text-sm text-ink"
            />
          </form>
        )}
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 0}
          aria-label="Previous page"
          className="rounded p-1.5 text-ink hover:bg-white disabled:text-line"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pageItems(current, Math.max(totalPages, 1)).map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className="px-1 text-muted">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p - 1)}
              aria-current={p === current ? 'page' : undefined}
              className={clsx(
                'h-8 min-w-8 rounded px-2 text-sm',
                p === current ? 'bg-primary font-semibold text-white' : 'text-ink hover:bg-white',
              )}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          aria-label="Next page"
          className="rounded p-1.5 text-ink hover:bg-white disabled:text-line"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </nav>
    </div>
  );
}
