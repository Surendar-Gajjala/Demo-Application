import { useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { Pencil } from 'lucide-react';
import { useState, type ComponentType, type ReactNode } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Header } from './layout/Header';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { useToast } from './ui/Toast';
import { ErrorState, LoadingState } from './ui/States';
import type { EntityFormProps } from './forms/types';

export interface DetailField<T> {
  label: string;
  render: (row: T) => ReactNode;
}

/** Extra tab after "Overview", e.g. Parts. Its key is kept in ?tab= so links and Back work. */
export interface DetailTab<T> {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
}

export interface DetailConfig<T extends { id: number }, R> {
  entityName: string; // "Item"
  listLabel: string; // "Items"
  listPath: string; // "/items"
  queryKey: string; // "items" (same root as the list, so list mutations refresh details too)
  get: (id: number) => Promise<T>;
  update: (id: number, body: R) => Promise<unknown>;
  Form: ComponentType<EntityFormProps<T, R>>;
  title: (row: T) => string;
  fields: DetailField<T>[];
  tabs?: DetailTab<T>[];
}

const OVERVIEW = 'overview';

/**
 * Details screen: "← <list>" header titled with the record, then tabs:
 * Overview (General info card) plus any relationship tabs from the config.
 */
export function DetailPage<T extends { id: number }, R>({ config }: { config: DetailConfig<T, R> }) {
  const { id: idParam } = useParams();
  const id = Number(idParam);
  const queryClient = useQueryClient();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const tabs = config.tabs ?? [];
  const requestedTab = searchParams.get('tab');
  const activeTab = tabs.find((t) => t.key === requestedTab) ? requestedTab! : OVERVIEW;
  const selectTab = (key: string) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (key === OVERVIEW) next.delete('tab');
        else next.set('tab', key);
        return next;
      },
      { replace: true },
    );

  const query = useQuery({
    queryKey: [config.queryKey, 'detail', id],
    queryFn: () => config.get(id),
    enabled: Number.isInteger(id) && id > 0,
  });
  const row = query.data;

  const back = { backTo: config.listPath, backLabel: `Back to ${config.listLabel}` };

  if (!Number.isInteger(id) || id <= 0) {
    return (
      <div className="flex h-full flex-col">
        <Header title={config.listLabel} {...back} />
        <ErrorState message={`Invalid ${config.entityName.toLowerCase()} id "${idParam}"`} />
      </div>
    );
  }

  const submit = async (request: R) => {
    await config.update(id, request);
    toast.success(`${config.entityName} updated successfully`);
    setEditing(false);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [config.queryKey] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['bom'] }),
    ]);
  };

  return (
    <div className="flex h-full flex-col">
      <Header
        title={row ? config.title(row) : config.listLabel}
        {...back}
        actions={
          row && (
            <Button onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" aria-hidden />
              Edit
            </Button>
          )
        }
      />

      {tabs.length > 0 && row && (
        <div role="tablist" aria-label={`${config.entityName} sections`} className="flex gap-1 border-b border-line bg-white px-8">
          {[{ key: OVERVIEW, label: 'Overview' }, ...tabs].map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={activeTab === t.key}
              onClick={() => selectTab(t.key)}
              className={clsx(
                '-mb-px border-b-2 px-3 py-3 text-[15px]',
                activeTab === t.key
                  ? 'border-primary font-medium text-ink'
                  : 'border-transparent text-muted hover:text-ink',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-auto bg-app px-8 py-6">
        {query.isPending && <LoadingState />}
        {query.isError && <ErrorState message={query.error.message} onRetry={() => query.refetch()} />}
        {row && activeTab !== OVERVIEW && <div role="tabpanel">{tabs.find((t) => t.key === activeTab)!.render(row)}</div>}
        {row && activeTab === OVERVIEW && (
          <section className="rounded-lg border border-line bg-white" aria-labelledby="general-heading">
            <h2 id="general-heading" className="border-b border-line px-5 py-4 text-[15px] text-ink">
              General
            </h2>
            <dl className="grid grid-cols-1 gap-x-10 gap-y-6 px-5 py-6 md:grid-cols-2">
              {config.fields.map((field) => (
                <div key={field.label} className="min-w-0">
                  <dt className="text-sm text-muted">{field.label}</dt>
                  <dd className="mt-1 break-words text-[15px] font-semibold text-ink">{field.render(row)}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </div>

      {row && (
        <Modal open={editing} title={`Edit ${config.entityName}`} onClose={() => setEditing(false)}>
          {editing && <config.Form initial={row} onSubmit={submit} onCancel={() => setEditing(false)} />}
        </Modal>
      )}
    </div>
  );
}
