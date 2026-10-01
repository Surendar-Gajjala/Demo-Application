import { useQuery } from '@tanstack/react-query';
import { itemsApi } from '../api/items';
import { partsApi } from '../api/parts';
import type { PartRequest, PartResponse } from '../api/types';
import { DetailPage, type DetailConfig } from '../components/DetailPage';
import { PartForm } from '../components/forms/PartForm';
import { RelatedList } from '../components/RelatedList';
import { siteColumns, siteOption } from '../components/relatedColumns';
import { DetailValue, LinkCell } from '../components/table/cells';
import { Badge } from '../components/ui/Badge';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States';
import { formatDateTime } from '../lib/format';

/** The part's parent item (Item 1 : N Part). */
function PartItemTab({ part }: { part: PartResponse }) {
  const itemId = part.itemId;
  const item = useQuery({
    queryKey: ['items', 'detail', itemId],
    queryFn: () => itemsApi.get(itemId!),
    enabled: itemId !== null,
  });

  let body;
  if (itemId === null)
    body = (
      <EmptyState
        title="Not assigned to an item"
        hint={`Edit the part, or use "Add Part" on an item's Parts tab, to assign ${part.partNumber}.`}
      />
    );
  else if (item.isPending) body = <LoadingState />;
  else if (item.isError) body = <ErrorState message={item.error.message} onRetry={() => item.refetch()} />;
  else
    body = (
      <dl className="grid grid-cols-1 gap-x-10 gap-y-6 px-5 py-6 md:grid-cols-2">
        {[
          { label: 'Item Number', value: <LinkCell to={`/items/${item.data.id}`}>{item.data.itemNumber}</LinkCell> },
          { label: 'Item Name', value: <DetailValue value={item.data.itemName} /> },
          { label: 'Item Type', value: <Badge value={item.data.type} /> },
          { label: 'Item Status', value: <Badge value={item.data.lifeCyclePhase} /> },
          { label: 'Product Family', value: <DetailValue value={item.data.productFamily} /> },
          { label: 'Description', value: <DetailValue value={item.data.description} /> },
        ].map((f) => (
          <div key={f.label} className="min-w-0">
            <dt className="text-sm text-muted">{f.label}</dt>
            <dd className="mt-1 break-words text-[15px] font-semibold text-ink">{f.value}</dd>
          </div>
        ))}
      </dl>
    );

  return (
    <section className="rounded-lg border border-line bg-white" aria-labelledby="parent-item-heading">
      <h2 id="parent-item-heading" className="border-b border-line px-5 py-4 text-[15px] text-ink">
        Parent Item
      </h2>
      {body}
    </section>
  );
}

function PartSitesTab({ part }: { part: PartResponse }) {
  return (
    <RelatedList
      entityName="Site"
      contextLabel={part.partNumber}
      queryKey={['sites', 'byPart', part.id]}
      list={(params) => partsApi.sites(part.id, params)}
      columns={siteColumns()}
      rowLabel={(s) => s.siteName}
      searchPlaceholder="Search sites..."
      candidates={(search) =>
        partsApi.siteCandidates(part.id, { search, size: 20 }).then((page) => page.content.map(siteOption))
      }
      candidatesEmptyText="No more sites to add"
      onAdd={(siteId) => partsApi.addSite(part.id, siteId)}
      onRemove={(site) => partsApi.removeSite(part.id, site.id)}
      removeNote="The site itself is not deleted."
      emptyHint={`Use "Add Site" to link ${part.partNumber} to a site.`}
    />
  );
}

const config: DetailConfig<PartResponse, PartRequest> = {
  entityName: 'Part',
  listLabel: 'Parts',
  listPath: '/parts',
  queryKey: 'parts',
  get: (id) => partsApi.get(id),
  update: (id, body) => partsApi.update(id, body),
  Form: PartForm,
  title: (p) => p.partNumber,
  fields: [
    { label: 'Part Number', render: (p) => <span className="text-link">{p.partNumber}</span> },
    { label: 'Manufacturer', render: (p) => <DetailValue value={p.manufactureName} /> },
    { label: 'Part Name', render: (p) => <DetailValue value={p.partName} /> },
    { label: 'Lifecycle Phase', render: (p) => <Badge value={p.lifeCyclePhase} /> },
    {
      label: 'Item',
      render: (p) =>
        p.itemId ? <LinkCell to={`/items/${p.itemId}`}>{p.itemNumber}</LinkCell> : <DetailValue value={null} />,
    },
    { label: 'Description', render: (p) => <DetailValue value={p.description} /> },
    { label: 'Created', render: (p) => <DetailValue value={formatDateTime(p.createdAt)} /> },
    { label: 'Last Updated', render: (p) => <DetailValue value={formatDateTime(p.updatedAt)} /> },
  ],
  tabs: [
    { key: 'item', label: 'Item', render: (p) => <PartItemTab part={p} /> },
    { key: 'sites', label: 'Sites', render: (p) => <PartSitesTab key={p.id} part={p} /> },
  ],
};

export function PartDetailPage() {
  return <DetailPage config={config} />;
}
