export const EMPTY = '—';

/** Value or an em dash for null / blank. */
export function dash(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return EMPTY;
  const s = String(value).trim();
  return s === '' ? EMPTY : s;
}

/** DESIGN -> Design, ASSEMBLY -> Assembly */
export function enumLabel(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

/** Drops trailing zeros: 2.000 -> "2", 2.500 -> "2.5". */
export function formatQuantity(value: number | null): string {
  if (value === null || value === undefined) return EMPTY;
  return Number(value).toLocaleString('en-US', { maximumFractionDigits: 3 });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
