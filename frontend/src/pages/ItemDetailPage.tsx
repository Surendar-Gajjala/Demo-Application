import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bomApi } from '../api/bom';
import { itemsApi } from '../api/items';
import type { BomNode, ItemRequest, ItemResponse } from '../api/types';
import { DetailPage, type DetailConfig } from '../components/DetailPage';
import { ItemForm } from '../components/forms/ItemForm';
import { RelatedList } from '../components/RelatedList';
import { partColumns, partOption } from '../components/relatedColumns';
import { DetailValue } from '../components/table/cells';
import { TreeTable, type TreeTableHandle } from '../components/table/TreeTable';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States';
import { formatDateTime } from '../lib/format';

/** Read-only multi-level BOM below the item (same tree as the Item Hierarchy). */
function ItemBomTab({ item }: { item: ItemResponse }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const tree = useRef<TreeTableHandle>(null);
  const [expandingAll, setExpandingAll] = useState(false);

  const loadChildren = (itemId: number) =>
    queryClient.fetchQuery({ queryKey: ['bom', 'children', itemId], queryFn: () => bomApi.children(itemId) });
  const loadSubtree = (itemId: number) =>
    queryClient.fetchQuery({ queryKey: ['bom', 'explode', itemId], queryFn: () => bomApi.explode(itemId) });

  const children = useQuery({ queryKey: ['bom', 'children', item.id], queryFn: () => bomApi.children(item.id) });
  const rows = children.data ?? [];

  let body = null;
  if (children.isPending) body = <LoadingState />;
  else if (children.isError) body = <ErrorState message={children.error.message} onRetry={() => children.refetch()} />;
  else if (rows.length === 0)
    body = <EmptyState title="No BOM items" hint="Add BOM items from the Item Hierarchy." />;

  const expandAll = async () => {
    setExpandingAll(true);
    try {
      await tree.current?.expandAll();
    } finally {
      setExpandingAll(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-lg border border-line bg-white" aria-label="BOM">
      <div className="flex items-center gap-2 border-b border-line bg-toolbar px-5 py-3">
        <span className="text-sm text-muted">Items used to build {item.itemNumber}</span>
        <div className="ml-auto flex gap-2">
          <Button onClick={expandAll} disabled={!rows.length || expandingAll}>
            <ChevronsUpDown className="h-4 w-4" aria-hidden />
            {expandingAll ? 'Expanding...' : 'Expand all'}
          </Button>
          <Button onClick={() => tree.current?.collapseAll()} disabled={!rows.length}>
            <ChevronsDownUp className="h-4 w-4" aria-hidden />
            Collapse all
          </Button>
        </div>
      </div>
      <TreeTable
        ref={tree}
        roots={rows}
        loadChildren={loadChildren}
        loadSubtree={loadSubtree}
        onOpenItem={(node: BomNode) => navigate(`/items/${node.itemId}`)}
      >
        {body}
      </TreeTable>
    </section>
  );
}

function ItemPartsTab({ item }: { item: ItemResponse }) {
  return (
    <RelatedList
      entityName="Part"
      contextLabel={item.itemNumber}
      queryKey={['parts', 'byItem', item.id]}
      list={(params) => itemsApi.parts(item.id, params)}
      columns={partColumns()}
      rowLabel={(p) => p.partNumber}
      searchPlaceholder="Search parts..."
      candidates={(search) =>
        itemsApi.partCandidates(item.id, { search, size: 20 }).then((page) => page.content.map(partOption))
      }
      candidatesEmptyText="No unassigned parts"
      onAdd={(partId) => itemsApi.addPart(item.id, partId)}
      onRemove={(part) => itemsApi.removePart(item.id, part.id)}
      removeNote="The part itself is not deleted."
      emptyHint={`Use "Add Part" to attach an existing part to ${item.itemNumber}.`}
    />
  );
}

const config: DetailConfig<ItemResponse, ItemRequest> = {
  entityName: 'Item',
  listLabel: 'Items',
  listPath: '/items',
  queryKey: 'items',
  get: (id) => itemsApi.get(id),
  update: (id, body) => itemsApi.update(id, body),
  Form: ItemForm,
  title: (i) => i.itemNumber,
  fields: [
    { label: 'Item Number', render: (i) => <span className="text-link">{i.itemNumber}</span> },
    { label: 'Item Name', render: (i) => <DetailValue value={i.itemName} /> },
    { label: 'Description', render: (i) => <DetailValue value={i.description} /> },
    { label: 'Product Family', render: (i) => <DetailValue value={i.productFamily} /> },
    { label: 'Item Type', render: (i) => <Badge value={i.type} /> },
    { label: 'Item Status', render: (i) => <Badge value={i.lifeCyclePhase} /> },
    { label: 'Created', render: (i) => <DetailValue value={formatDateTime(i.createdAt)} /> },
    { label: 'Last Updated', render: (i) => <DetailValue value={formatDateTime(i.updatedAt)} /> },
  ],
  tabs: [
    { key: 'bom', label: 'BOM', render: (i) => <ItemBomTab key={i.id} item={i} /> },
    { key: 'parts', label: 'Parts', render: (i) => <ItemPartsTab key={i.id} item={i} /> },
  ],
};

export function ItemDetailPage() {
  return <DetailPage config={config} />;
}
