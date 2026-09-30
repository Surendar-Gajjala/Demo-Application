import { itemsApi } from '../api/items';
import type { ItemRequest, ItemResponse } from '../api/types';
import { ItemForm } from '../components/forms/ItemForm';
import { MasterDataPage, type MasterDataConfig } from '../components/MasterDataPage';
import { LinkCell, TextCell } from '../components/table/cells';
import { Badge } from '../components/ui/Badge';

const config: MasterDataConfig<ItemResponse, ItemRequest> = {
  title: 'Items',
  subtitle: 'Products, assemblies and finished goods.',
  entityName: 'Item',
  queryKey: 'items',
  searchPlaceholder: 'Search number or name...',
  api: itemsApi,
  label: (item) => item.itemNumber,
  Form: ItemForm,
  columns: (detailPath) => [
    {
      key: 'itemNumber',
      header: 'Item Number',
      sortField: 'itemNumber',
      className: 'whitespace-nowrap',
      render: (i) => <LinkCell to={detailPath(i)}>{i.itemNumber}</LinkCell>,
    },
    { key: 'itemName', header: 'Item Name', sortField: 'itemName', render: (i) => <TextCell value={i.itemName} /> },
    { key: 'description', header: 'Description', render: (i) => <TextCell value={i.description} wrap /> },
    { key: 'type', header: 'Item Type', sortField: 'type', render: (i) => <Badge value={i.type} /> },
    {
      key: 'lifeCyclePhase',
      header: 'Item Status',
      sortField: 'lifeCyclePhase',
      render: (i) => <Badge value={i.lifeCyclePhase} />,
    },
    {
      key: 'productFamily',
      header: 'Product Family',
      sortField: 'productFamily',
      render: (i) => <TextCell value={i.productFamily} />,
    },
  ],
};

export function ItemsPage() {
  return <MasterDataPage config={config} />;
}
