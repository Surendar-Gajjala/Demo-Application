import { partsApi } from '../api/parts';
import type { PartRequest, PartResponse } from '../api/types';
import { PartForm } from '../components/forms/PartForm';
import { MasterDataPage, type MasterDataConfig } from '../components/MasterDataPage';
import { itemColumn } from '../components/relatedColumns';
import { LinkCell, TextCell } from '../components/table/cells';
import { Badge } from '../components/ui/Badge';

const config: MasterDataConfig<PartResponse, PartRequest> = {
  title: 'Parts',
  subtitle: 'Sourced and manufactured components.',
  entityName: 'Part',
  queryKey: 'parts',
  searchPlaceholder: 'Search number or name...',
  api: partsApi,
  label: (part) => part.partNumber,
  Form: PartForm,
  columns: (detailPath) => [
    {
      key: 'partNumber',
      header: 'Part Number',
      sortField: 'partNumber',
      className: 'whitespace-nowrap',
      render: (p) => <LinkCell to={detailPath(p)}>{p.partNumber}</LinkCell>,
    },
    { key: 'partName', header: 'Part Name', sortField: 'partName', render: (p) => <TextCell value={p.partName} /> },
    { key: 'description', header: 'Description', render: (p) => <TextCell value={p.description} wrap /> },
    {
      key: 'manufactureName',
      header: 'Manufacturer',
      sortField: 'manufactureName',
      render: (p) => <TextCell value={p.manufactureName} />,
    },
    {
      key: 'lifeCyclePhase',
      header: 'Lifecycle Phase',
      sortField: 'lifeCyclePhase',
      render: (p) => <Badge value={p.lifeCyclePhase} />,
    },
    itemColumn(),
  ],
};

export function PartsPage() {
  return <MasterDataPage config={config} />;
}
