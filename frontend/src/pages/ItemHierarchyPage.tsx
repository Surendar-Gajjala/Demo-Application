import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronsDownUp, ChevronsUpDown, Plus } from 'lucide-react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bomApi } from '../api/bom';
import type { BomLinkRequest, BomNode } from '../api/types';
import { BomItemForm } from '../components/forms/BomItemForm';
import { Header } from '../components/layout/Header';
import { Pagination } from '../components/table/Pagination';
import { SearchBar } from '../components/table/SearchBar';
import { TreeTable, type TreeTableHandle } from '../components/table/TreeTable';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States';
import { useTableParams } from '../hooks/useTableParams';

const ADD_BUTTON =
  'inline-flex h-7 w-7 items-center justify-center rounded-md border border-line bg-white text-ink hover:bg-toolbar';

export function ItemHierarchyPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const tree = useRef<TreeTableHandle>(null);
  const [expandingAll, setExpandingAll] = useState(false);
  const { params, setParams } = useTableParams();
  // Row "+": fixed parent. Header "+": the user picks the parent from the top-level items.
  const [addingTo, setAddingTo] = useState<{ parent?: BomNode; rowKey?: string } | null>(null);

  const roots = useQuery({
    queryKey: ['bom', 'roots', params],
    queryFn: () => bomApi.roots(params),
    placeholderData: keepPreviousData,
  });

  const loadChildren = (itemId: number) =>
    queryClient.fetchQuery({ queryKey: ['bom', 'children', itemId], queryFn: () => bomApi.children(itemId) });
  const loadSubtree = (itemId: number) =>
    queryClient.fetchQuery({ queryKey: ['bom', 'explode', itemId], queryFn: () => bomApi.explode(itemId) });

  const expandAll = async () => {
    setExpandingAll(true);
    try {
      await tree.current?.expandAll();
    } finally {
      setExpandingAll(false);
    }
  };

  /** Saves parent -> child, then refreshes that row (keeping the tree expanded) and dependent data. */
  const addBomItem = async (parentId: number, request: BomLinkRequest) => {
    await bomApi.addChild(parentId, request);
    queryClient.removeQueries({ queryKey: ['bom', 'children', parentId] });
    queryClient.removeQueries({ queryKey: ['bom', 'explode'] });
    queryClient.removeQueries({ queryKey: ['bom', 'candidates'] });
    // Header adds always target a top-level row, whose key is /r{id}.
    await tree.current?.reloadChildren(parentId, addingTo?.rowKey ?? `/r${parentId}`);
    setAddingTo(null);
    void queryClient.invalidateQueries({ queryKey: ['bom', 'roots'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const page = roots.data;

  let body = null;
  if (roots.isPending) body = <LoadingState />;
  else if (roots.isError) body = <ErrorState message={roots.error.message} onRetry={() => roots.refetch()} />;
  else if (page && page.content.length === 0)
    body = <EmptyState title="No products found" hint="Only items that have a BOM and no parent are listed here." />;

  return (
    <div className="flex h-full flex-col">
      <Header
        title="Item Hierarchy"
        subtitle="Browse products and expand their assemblies and child items."
        backTo="/dashboard"
        backLabel="Back to Home"
      />

      <div className="flex flex-wrap items-center gap-3 border-b border-line bg-toolbar px-8 py-4">
        <SearchBar
          value={String(params.search ?? '')}
          onChange={(search) => setParams({ search })}
          placeholder="Search top-level items..."
        />
        <div className="ml-auto flex items-center gap-2">
          <Button onClick={expandAll} disabled={!page?.content.length || expandingAll}>
            <ChevronsUpDown className="h-4 w-4" aria-hidden />
            {expandingAll ? 'Expanding...' : 'Expand all'}
          </Button>
          <Button onClick={() => tree.current?.collapseAll()} disabled={!page?.content.length}>
            <ChevronsDownUp className="h-4 w-4" aria-hidden />
            Collapse all
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <TreeTable
          // Reset expansion when page or search changes, but not on a plain refetch (e.g. after adding).
          key={JSON.stringify(params)}
          ref={tree}
          roots={page?.content ?? []}
          loadChildren={loadChildren}
          loadSubtree={loadSubtree}
          onOpenItem={(node: BomNode) => navigate(`/items/${node.itemId}`)}
          headerAction={
            <button
              type="button"
              className={ADD_BUTTON}
              aria-label="Add BOM item"
              title="Add BOM item"
              onClick={() => setAddingTo({})}
            >
              <Plus className="h-4 w-4" />
            </button>
          }
          renderActions={(node, rowKey) => (
            <button
              type="button"
              className={ADD_BUTTON}
              aria-label={`Add BOM item under ${node.itemNumber}`}
              title="Add BOM item"
              onClick={() => setAddingTo({ parent: node, rowKey })}
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        >
          {body}
        </TreeTable>
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

      <Modal open={addingTo !== null} title="Add BOM Item" onClose={() => setAddingTo(null)}>
        {addingTo && (
          <BomItemForm
            key={addingTo.rowKey ?? 'header'}
            parent={addingTo.parent}
            onSubmit={addBomItem}
            onCancel={() => setAddingTo(null)}
          />
        )}
      </Modal>
    </div>
  );
}
