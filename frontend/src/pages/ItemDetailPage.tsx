import { itemsApi } from '../api/items';
import type { ItemRequest, ItemResponse } from '../api/types';
import { DetailPage, type DetailConfig } from '../components/DetailPage';
import { ItemForm } from '../components/forms/ItemForm';
import { DetailValue } from '../components/table/cells';
import { Badge } from '../components/ui/Badge';
import { formatDateTime } from '../lib/format';

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
};

export function ItemDetailPage() {
  return <DetailPage config={config} />;
}
