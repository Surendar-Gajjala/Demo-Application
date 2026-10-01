import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { ChevronDown, Loader2 } from 'lucide-react';
import { useId, useState, type KeyboardEvent } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { TextInput } from './FormField';

/** One choice: an identifier (item / part number, site name) and a secondary name. */
export interface PickerOption {
  id: number;
  code: string;
  name?: string | null;
}

const label = (o: PickerOption) => (o.name ? `${o.code} · ${o.name}` : o.code);

interface Props {
  /** React Query key prefix; the search text is appended. */
  queryKey: unknown[];
  /** Loads the options matching the search text. */
  load: (search: string) => Promise<PickerOption[]>;
  onSelect: (item: PickerOption | null) => void;
  error?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  placeholder?: string;
  emptyText?: string;
  /** Pre-selected option (e.g. when editing). */
  initial?: PickerOption | null;
}

/**
 * Searchable dropdown of records (items, parts, sites). Typing searches on
 * the server (debounced).
 */
export function RecordPicker({
  queryKey,
  load,
  onSelect,
  error,
  autoFocus,
  disabled,
  placeholder = 'Search item number or name...',
  emptyText = 'No items can be added',
  initial = null,
}: Props) {
  const listId = useId();
  const [text, setText] = useState(initial ? label(initial) : '');
  const [selected, setSelected] = useState<PickerOption | null>(initial);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  // While the input shows the chosen item's label, list everything again.
  const search = useDebounce(selected && text === label(selected) ? '' : text.trim(), 250);

  const query = useQuery({
    queryKey: [...queryKey, search],
    queryFn: () => load(search),
    enabled: open && !disabled,
  });
  const options = query.data ?? [];

  const choose = (item: PickerOption) => {
    setSelected(item);
    setText(label(item));
    setOpen(false);
    onSelect(item);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) setOpen(true);
      else setActive((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (open && options[active]) {
        e.preventDefault();
        choose(options[active]);
      }
    } else if (e.key === 'Escape' && open) {
      e.stopPropagation(); // close the list, not the modal
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <TextInput
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoFocus={autoFocus}
        autoComplete="off"
        placeholder={placeholder}
        disabled={disabled}
        value={text}
        error={error}
        className="pr-8"
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        onChange={(e) => {
          setText(e.target.value);
          setActive(0);
          setOpen(true);
          if (selected) {
            setSelected(null);
            onSelect(null);
          }
        }}
      />
      <ChevronDown className="pointer-events-none absolute right-2.5 top-[calc(50%+2px)] h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />

      {open && !disabled && (
        <ul
          id={listId}
          role="listbox"
          // Keep focus in the input so onBlur does not close before a click lands.
          onMouseDown={(e) => e.preventDefault()}
          className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-md border border-line bg-white py-1 text-sm font-normal shadow-lg"
        >
          {query.isFetching && options.length === 0 && (
            <li className="flex items-center gap-2 px-3 py-2 text-muted">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Loading...
            </li>
          )}
          {query.isError && <li className="px-3 py-2 text-red-600">{query.error.message}</li>}
          {!query.isFetching && query.isSuccess && options.length === 0 && (
            <li className="px-3 py-2 text-muted">{emptyText}</li>
          )}
          {options.map((item, i) => (
            <li
              key={item.id}
              role="option"
              aria-selected={selected?.id === item.id}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(item)}
              className={clsx(
                'flex cursor-pointer items-center gap-2 px-3 py-2',
                i === active && 'bg-interactive-bg-secondary-hover',
              )}
            >
              <span className="shrink-0 text-link">{item.code}</span>
              {item.name && <span className="truncate text-ink">{item.name}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
