import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState, type ComponentType } from 'react';
import type { ListParams, PageResponse } from '../api/types';
import { useTableParams } from '../hooks/useTableParams';
import { Header } from './layout/Header';
import { DataTable, type Column } from './table/DataTable';
import { Pagination } from './table/Pagination';
import { SearchBar } from './table/SearchBar';
import { Button, IconButton } from './ui/Button';
import { ConfirmationDialog } from './ui/ConfirmationDialog';
import { Modal } from './ui/Modal';
import { EmptyState, ErrorState, LoadingState } from './ui/States';
import type { EntityFormProps } from './forms/types';

export interface MasterDataConfig<T extends { id: number }, R> {
  title: string;
  subtitle: string;
  entityName: string; // "Item"
  queryKey: string; // "items"
  searchPlaceholder: string;
  api: {
    list: (params: ListParams) => Promise<PageResponse<T>>;
    create: (body: R) => Promise<unknown>;
    update: (id: number, body: R) => Promise<unknown>;
    remove: (id: number) => Promise<void>;
  };
  /** Columns; `detailPath` gives the details page URL for a row (used by identifier links). */
  columns: (detailPath: (row: T) => string) => Column<T>[];
  Form: ComponentType<EntityFormProps<T, R>>;
  /** Human label for confirmations, e.g. the item number. */
  label: (row: T) => string;
}

/**
 * Shared screen for Items, Parts and Sites: header, search + Add,
 * sortable table with hover actions, pagination, add/edit modal, delete confirmation.
 */
export function MasterDataPage<T extends { id: number }, R>({ config }: { config: MasterDataConfig<T, R> }) {
  const { title, subtitle, entityName, queryKey, api, Form } = config;
  const queryClient = useQueryClient();
  const { params, setParams } = useTableParams();

  const [editing, setEditing] = useState<T | 'new' | null>(null);
  const [deleting, setDeleting] = useState<T | null>(null);

  const query = useQuery({
    queryKey: [queryKey, params],
    queryFn: () => api.list(params),
    placeholderData: keepPreviousData,
  });

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: [queryKey] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['bom'] }),
    ]);

  const remove = useMutation({
    mutationFn: (row: T) => api.remove(row.id),
    onSuccess: async () => {
      setDeleting(null);
      await invalidate();
    },
  });

  const submit = async (request: R) => {
    if (editing === 'new') await api.create(request);
    else if (editing) await api.update(editing.id, request);
    setEditing(null);
    await invalidate();
  };

  const page = query.data;
  const hasCriteria = Boolean(params.search);

  let body = null;
  if (query.isPending) body = <LoadingState />;
  else if (query.isError) body = <ErrorState message={query.error.message} onRetry={() => query.refetch()} />;
  else if (page && page.content.length === 0)
    body = (
      <EmptyState
        title={hasCriteria ? `No ${title.toLowerCase()} match your search` : `No ${title.toLowerCase()} yet`}
        hint={hasCriteria ? 'Try a different search.' : `Use "Add ${entityName}" to create one.`}
      />
    );

  return (
    <div className="flex h-full flex-col">
      <Header title={title} subtitle={subtitle} backTo="/dashboard" backLabel="Back to Home" />

      <div className="flex flex-wrap items-center gap-3 border-b border-line bg-toolbar px-8 py-4">
        <SearchBar
          value={String(params.search ?? '')}
          onChange={(search) => setParams({ search })}
          placeholder={config.searchPlaceholder}
        />
        <div className="ml-auto flex items-center gap-2">
          <Button variant="primary" onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" aria-hidden />
            Add {entityName}
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <DataTable
          columns={config.columns((row) => `/${queryKey}/${row.id}`)}
          rows={page?.content ?? []}
          rowKey={(row) => row.id}
          sort={String(params.sort ?? '')}
          onSortChange={(sort) => setParams({ sort })}
          actions={(row) => (
            <>
              <IconButton className="h-8 w-8" onClick={() => setEditing(row)} aria-label={`Edit ${config.label(row)}`}>
                <Pencil className="h-3.5 w-3.5" />
              </IconButton>
              <IconButton
                className="h-8 w-8 hover:text-red-600"
                onClick={() => {
                  remove.reset();
                  setDeleting(row);
                }}
                aria-label={`Delete ${config.label(row)}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </IconButton>
            </>
          )}
        >
          {body}
        </DataTable>
      </div>

      {page && (
        <Pagination
          page={page.page}
          size={page.size}
          totalElements={page.totalElements}
          totalPages={page.totalPages}
          onPageChange={(p) => setParams({ page: p })}
          onSizeChange={(size) => setParams({ size })}
        />
      )}

      <Modal
        open={editing !== null}
        title={editing === 'new' ? `Add ${entityName}` : `Edit ${entityName}`}
        onClose={() => setEditing(null)}
      >
        {editing !== null && (
          <Form
            key={editing === 'new' ? 'new' : editing.id}
            initial={editing === 'new' ? undefined : editing}
            onSubmit={submit}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <ConfirmationDialog
        open={deleting !== null}
        title={`Delete ${entityName}`}
        message={
          deleting
            ? `Delete ${entityName.toLowerCase()} "${config.label(deleting)}"? This cannot be undone.` +
              (entityName === 'Item' ? ' Its BOM links are removed too.' : '')
            : ''
        }
        busy={remove.isPending}
        error={remove.error?.message ?? null}
        onConfirm={() => deleting && remove.mutate(deleting)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
