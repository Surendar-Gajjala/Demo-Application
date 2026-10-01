import { sitesApi } from '../api/sites';
import type { SiteRequest, SiteResponse } from '../api/types';
import { DetailPage, type DetailConfig } from '../components/DetailPage';
import { SiteForm } from '../components/forms/SiteForm';
import { RelatedList } from '../components/RelatedList';
import { partColumns, partOption } from '../components/relatedColumns';
import { DetailValue } from '../components/table/cells';
import { formatDateTime } from '../lib/format';

function SitePartsTab({ site }: { site: SiteResponse }) {
  return (
    <RelatedList
      entityName="Part"
      contextLabel={site.siteName}
      queryKey={['parts', 'bySite', site.id]}
      list={(params) => sitesApi.parts(site.id, params)}
      columns={partColumns({ withItem: true })}
      rowLabel={(p) => p.partNumber}
      searchPlaceholder="Search parts..."
      candidates={(search) =>
        sitesApi.partCandidates(site.id, { search, size: 20 }).then((page) => page.content.map(partOption))
      }
      candidatesEmptyText="No more parts to add"
      onAdd={(partId) => sitesApi.addPart(site.id, partId)}
      onRemove={(part) => sitesApi.removePart(site.id, part.id)}
      removeNote="The part itself is not deleted."
      emptyHint={`Use "Add Part" to link a part to ${site.siteName}.`}
    />
  );
}

const config: DetailConfig<SiteResponse, SiteRequest> = {
  entityName: 'Site',
  listLabel: 'Sites',
  listPath: '/sites',
  queryKey: 'sites',
  get: (id) => sitesApi.get(id),
  update: (id, body) => sitesApi.update(id, body),
  Form: SiteForm,
  title: (s) => s.siteName,
  fields: [
    { label: 'Site Name', render: (s) => <span className="text-link">{s.siteName}</span> },
    { label: 'Site Type', render: (s) => <DetailValue value={s.siteType} /> },
    { label: 'Workcenter', render: (s) => <DetailValue value={s.workcenter} /> },
    { label: 'Address', render: (s) => <DetailValue value={s.address} /> },
    { label: 'Created', render: (s) => <DetailValue value={formatDateTime(s.createdAt)} /> },
    { label: 'Last Updated', render: (s) => <DetailValue value={formatDateTime(s.updatedAt)} /> },
  ],
  tabs: [{ key: 'parts', label: 'Parts', render: (s) => <SitePartsTab key={s.id} site={s} /> }],
};

export function SiteDetailPage() {
  return <DetailPage config={config} />;
}
