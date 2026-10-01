import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Unlink } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { ListParams, PageResponse } from '../api/types';
import { Field } from './forms/FormField';
import { FormActions } from './forms/FormActions';
import { RecordPicker, type PickerOption } from './forms/RecordPicker';
import { DataTable, type Column } from './table/DataTable';
import { Pagination } from './table/Pagination';
import { SearchBar } from './table/SearchBar';
import { Button, IconButton } from './ui/Button';
import { ConfirmationDialog } from './ui/ConfirmationDialog';
import { Modal } from './ui/Modal';
import { EmptyState, ErrorState, LoadingState } from './ui/States';
import { useToast } from './ui/Toast';

export interface RelatedListProps<T extends { id: number }> {
  /** Linked entity, singular: "Part", "Site". */
  entityName: string;
  /** The record whose tab this is, for messages: "PROD-001". */
  contextLabel: string;
  /** Query key prefix for the list, under an existing root (e.g. ['parts', 'byItem', 7]). */
  queryKey: unknown[];
  list: (params: ListParams) => Promise<PageResponse<T>>;
  columns: Column<T>[];
  /** Short label of a linked row: "A-2041". */
  rowLabel: (row: T) => string;
  searchPlaceholder: string;
  /** Records that can be linked, for the Add dropdown. */
  candidates: (search: string) => Promise<PickerOption[]>;
  /** Shown in the Add dropdown when there are no candidates. */
  candidatesEmptyText: string;
  onAdd: (id: number) => Promise<unknown>;
  onRemove: (row: T) => Promise<unknown>;
  /** Extra sentence in the remove confirmation. */
  removeNote: string;
  emptyHint?: string;
}

/**
 * A relationship tab: search, linked rows with a hover "Remove" (unlink),
 * pagination, and "Add <entity>" picking an existing record from a dropdown.
 * Links are created / removed; the records themselves never are.
 */
export function RelatedList<T extends { id: number }>(props: RelatedListProps<T>) {
  const { entityName, contextLabel, queryKey, rowLabel } = props;
  const queryClient = useQueryClient();
  const toast = useToast();
  const [params, setParams] = useState<ListParams>({ search: '', page: 0, size: 20 });
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<T | null>(null);

  const query = useQuery({
    queryKey: [...queryKey, params],
    queryFn: () => props.list(params),
    placeholderData: keepPreviousData,
  });

  // Links change lists and details on both sides (parts, sites, items) and the dashboard.
  const refresh = () =>
    Promise.all(
      [['parts'], ['sites'], ['items'], ['dashboard']].map((key) => queryClient.invalidateQueries({ queryKey: key })),
    );

  const remove = useMutation({
    mutationFn: (row: T) => props.onRemove(row),
    onSuccess: async (_, row) => {
      setRemoving(null);
      toast.success(`${entityName} ${rowLabel(row)} removed from ${contextLabel}`);
      await refresh();
    },
  });

  const add = async (option: PickerOption) => {
    await props.onAdd(option.id);
    setAdding(false);
    toast.success(`${entityName} ${option.code} added to ${contextLabel}`);
    await refresh();
  };

  const setSearch = (search: string) => setParams((p) => ({ ...p, search, page: 0 }));
  const page = query.data;
  const plural = `${entityName.toLowerCase()}s`;

  let body = null;
  if (query.isPending) body = <LoadingState />;
  else if (query.isError) body = <ErrorState message={query.error.message} onRetry={() => query.refetch()} />;
  else if (page && page.content.length === 0)
    body = params.search ? (
      <EmptyState title={`No ${plural} match your search`} hint="Try a different search." />
    ) : (
      <EmptyState title={`No ${plural} yet`} hint={props.emptyHint ?? `Use "Add ${entityName}" to add one.`} />
    );

  return (
    <section className="overflow-hidden rounded-lg border border-line bg-white" aria-label={`${entityName}s`}>
      <div className="flex flex-wrap items-center gap-3 border-b border-line bg-toolbar px-5 py-3">
        <SearchBar value={String(params.search ?? '')} onChange={setSearch} placeholder={props.searchPlaceholder} />
        <Button variant="primary" className="ml-auto" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" aria-hidden />
          Add {entityName}
        </Button>
      </div>

      <DataTable
        columns={props.columns}
        rows={page?.content ?? []}
        rowKey={(row) => row.id}
        actions={(row) => (
          <IconButton
            className="h-8 w-8 hover:text-red-600"
            title={`Remove from ${contextLabel}`}
            aria-label={`Remove ${rowLabel(row)} from ${contextLabel}`}
            onClick={() => {
              remove.reset();
              setRemoving(row);
            }}
          >
            <Unlink className="h-3.5 w-3.5" />
          </IconButton>
        )}
      >
        {body}
      </DataTable>

      {page && page.totalElements > 0 && (
        <Pagination
          page={page.page}
          size={page.size}
          totalElements={page.totalElements}
          totalPages={page.totalPages}
          onPageChange={(p) => setParams((prev) => ({ ...prev, page: p }))}
          onSizeChange={(size) => setParams((prev) => ({ ...prev, size, page: 0 }))}
        />
      )}

      <Modal open={adding} title={`Add ${entityName}`} onClose={() => setAdding(false)}>
        {adding && (
          <AddLinkForm
            entityName={entityName}
            contextLabel={contextLabel}
            queryKey={[...queryKey, 'candidates']}
            load={props.candidates}
            emptyText={props.candidatesEmptyText}
            onSubmit={add}
            onCancel={() => setAdding(false)}
          />
        )}
      </Modal>

      <ConfirmationDialog
        open={removing !== null}
        title={`Remove ${entityName}`}
        message={removing ? `Remove ${rowLabel(removing)} from ${contextLabel}? ${props.removeNote}` : ''}
        confirmLabel="Remove"
        busy={remove.isPending}
        error={remove.error?.message ?? null}
        onConfirm={() => removing && remove.mutate(removing)}
        onCancel={() => setRemoving(null)}
      />
    </section>
  );
}

interface AddLinkFormProps {
  entityName: string;
  contextLabel: string;
  queryKey: unknown[];
  load: (search: string) => Promise<PickerOption[]>;
  emptyText: string;
  onSubmit: (option: PickerOption) => Promise<void>;
  onCancel: () => void;
}

/** Pick one existing record to link to the current one. */
function AddLinkForm({ entityName, contextLabel, queryKey, load, emptyText, onSubmit, onCancel }: AddLinkFormProps) {
  const [selected, setSelected] = useState<PickerOption | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected) {
      setFieldError(`Select a ${entityName.toLowerCase()}`);
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await onSubmit(selected);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <p className="mb-4 rounded-md border border-line bg-toolbar px-3 py-2 text-sm text-muted">
        Add to: <span className="font-medium text-link">{contextLabel}</span>
      </p>
      <Field label={entityName} required error={fieldError}>
        <RecordPicker
          queryKey={queryKey}
          load={load}
          autoFocus
          placeholder={`Search ${entityName.toLowerCase()}s...`}
          emptyText={emptyText}
          error={fieldError}
          onSelect={(option) => {
            setSelected(option);
            if (option) setFieldError(undefined);
          }}
        />
      </Field>
      <FormActions submitting={submitting} submitLabel={`Add ${entityName}`} error={formError} onCancel={onCancel} />
    </form>
  );
}
