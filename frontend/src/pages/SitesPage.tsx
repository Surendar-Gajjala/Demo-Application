import { sitesApi } from '../api/sites';
import type { SiteRequest, SiteResponse } from '../api/types';
import { SiteForm } from '../components/forms/SiteForm';
import { MasterDataPage, type MasterDataConfig } from '../components/MasterDataPage';
import { LinkCell, TextCell } from '../components/table/cells';

const config: MasterDataConfig<SiteResponse, SiteRequest> = {
  title: 'Sites',
  subtitle: 'Plants, production lines and work centers.',
  entityName: 'Site',
  queryKey: 'sites',
  searchPlaceholder: 'Search site name...',
  api: sitesApi,
  label: (site) => site.siteName,
  Form: SiteForm,
  columns: (detailPath) => [
    {
      key: 'siteName',
      header: 'Site Name',
      sortField: 'siteName',
      render: (s) => <LinkCell to={detailPath(s)}>{s.siteName}</LinkCell>,
    },
    { key: 'siteType', header: 'Site Type', sortField: 'siteType', render: (s) => <TextCell value={s.siteType} /> },
    {
      key: 'workcenter',
      header: 'Workcenter',
      sortField: 'workcenter',
      render: (s) => <TextCell value={s.workcenter} />,
    },
    { key: 'address', header: 'Address', render: (s) => <TextCell value={s.address} wrap /> },
  ],
};

export function SitesPage() {
  return <MasterDataPage config={config} />;
}
