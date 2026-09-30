import { partsApi } from '../api/parts';
import type { PartRequest, PartResponse } from '../api/types';
import { DetailPage, type DetailConfig } from '../components/DetailPage';
import { PartForm } from '../components/forms/PartForm';
import { DetailValue } from '../components/table/cells';
import { Badge } from '../components/ui/Badge';
import { formatDateTime } from '../lib/format';

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
    { label: 'Description', render: (p) => <DetailValue value={p.description} /> },
    { label: 'Created', render: (p) => <DetailValue value={formatDateTime(p.createdAt)} /> },
    { label: 'Last Updated', render: (p) => <DetailValue value={formatDateTime(p.updatedAt)} /> },
  ],
};

export function PartDetailPage() {
  return <DetailPage config={config} />;
}
