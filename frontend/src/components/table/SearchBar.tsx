import { Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDebounce } from '../../hooks/useDebounce';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/** Search input that reports changes after the user stops typing. */
export function SearchBar({ value, onChange, placeholder = 'Search...' }: Props) {
  const [text, setText] = useState(value);
  const debounced = useDebounce(text, 300);

  useEffect(() => setText(value), [value]);

  useEffect(() => {
    if (debounced !== value) onChange(debounced);
    // Only react to the debounced text.
  }, [debounced]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <label className="relative block w-[300px] max-w-full">
      <span className="sr-only">Search</span>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
      <input
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-md border border-line bg-white pl-9 pr-8 text-sm placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
      {text && (
        <button
          type="button"
          onClick={() => {
            setText('');
            onChange('');
          }}
          aria-label="Clear search"
          title="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted hover:bg-toolbar hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </label>
  );
}
