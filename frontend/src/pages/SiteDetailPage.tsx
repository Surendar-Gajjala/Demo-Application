import { sitesApi } from '../api/sites';
import type { SiteRequest, SiteResponse } from '../api/types';
import { DetailPage, type DetailConfig } from '../components/DetailPage';
import { SiteForm } from '../components/forms/SiteForm';
import { DetailValue } from '../components/table/cells';
import { formatDateTime } from '../lib/format';

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
};

export function SiteDetailPage() {
  return <DetailPage config={config} />;
}
