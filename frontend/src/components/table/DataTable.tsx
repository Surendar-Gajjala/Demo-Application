import clsx from 'clsx';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  /** Backend sort field; column header becomes clickable when set. */
  sortField?: string;
  className?: string;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  sort?: string; // "field,asc|desc"
  onSortChange?: (sort: string) => void;
  actions?: (row: T) => ReactNode;
  children?: ReactNode; // rendered instead of rows (loading / empty / error)
}

function parseSort(sort?: string): { field: string; dir: 'asc' | 'desc' } | null {
  if (!sort) return null;
  const [field, dir] = sort.split(',');
  return { field, dir: dir === 'desc' ? 'desc' : 'asc' };
}

/** Reference-style table: grey sticky header with dividers, white rows, hover actions. */
export function DataTable<T>({ columns, rows, rowKey, sort, onSortChange, actions, children }: Props<T>) {
  const current = parseSort(sort);

  const toggleSort = (field: string) => {
    if (!onSortChange) return;
    if (current?.field !== field) onSortChange(`${field},asc`);
    else if (current.dir === 'asc') onSortChange(`${field},desc`);
    else onSortChange('');
  };

  return (
    <table className="w-full border-separate border-spacing-0 text-[15px]">
      <thead className="sticky top-0 z-10">
        <tr>
          {columns.map((col, i) => {
            const sorted = col.sortField && current?.field === col.sortField ? current.dir : null;
            return (
              <th
                key={col.key}
                scope="col"
                aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined}
                className={clsx(
                  'whitespace-nowrap border-b border-line bg-table-header px-4 py-3 text-left font-semibold text-ink',
                  i === 0 ? 'pl-8' : 'border-l',
                  col.className,
                )}
              >
                {col.sortField && onSortChange ? (
                  <button
                    type="button"
                    onClick={() => toggleSort(col.sortField!)}
                    className="group inline-flex items-center gap-1"
                  >
                    {col.header}
                    {sorted === 'asc' ? (
                      <ArrowUp className="h-3.5 w-3.5" aria-hidden />
                    ) : sorted === 'desc' ? (
                      <ArrowDown className="h-3.5 w-3.5" aria-hidden />
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 text-muted opacity-0 group-hover:opacity-100" aria-hidden />
                    )}
                  </button>
                ) : (
                  col.header
                )}
              </th>
            );
          })}
          {actions && (
            <th
              scope="col"
              className="w-28 whitespace-nowrap border-b border-l border-line bg-table-header px-4 py-3 text-left font-semibold text-ink"
            >
              Actions
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {children ? (
          <tr>
            <td colSpan={columns.length + (actions ? 1 : 0)}>{children}</td>
          </tr>
        ) : (
          rows.map((row) => (
            <tr key={rowKey(row)} className="group hover:bg-interactive-bg-secondary-hover">
              {columns.map((col, i) => (
                <td
                  key={col.key}
                  className={clsx('border-b border-line px-4 py-2.5 align-middle', i === 0 && 'pl-8', col.className)}
                >
                  {col.render(row)}
                </td>
              ))}
              {actions && (
                <td className="border-b border-line px-4 py-2.5">
                  <div className="flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                    {actions(row)}
                  </div>
                </td>
              )}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
