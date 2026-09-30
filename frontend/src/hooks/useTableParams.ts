import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ListParams } from '../api/types';

export const PAGE_SIZES = [25, 50, 100];
export const DEFAULT_PAGE_SIZE = 25;

/**
 * Table state (search, filters, page, size, sort) kept in the URL so it
 * survives reloads and can be shared. Any change except page resets to page 0.
 */
export function useTableParams(filterKeys: string[] = []) {
  const [searchParams, setSearchParams] = useSearchParams();

  const params: ListParams = useMemo(() => {
    const result: ListParams = {
      search: searchParams.get('search') ?? '',
      page: Number(searchParams.get('page') ?? 0),
      size: Number(searchParams.get('size') ?? DEFAULT_PAGE_SIZE),
      sort: searchParams.get('sort') ?? '',
    };
    for (const key of filterKeys) {
      result[key] = searchParams.get(key) ?? '';
    }
    return result;
    // filterKeys is a static list per page
  }, [searchParams]);

  const setParams = useCallback(
    (changes: Record<string, string | number | undefined>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(changes)) {
            if (value === undefined || value === '') next.delete(key);
            else next.set(key, String(value));
          }
          if (!('page' in changes)) next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return { params, setParams };
}
