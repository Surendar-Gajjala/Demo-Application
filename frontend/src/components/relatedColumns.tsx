import type { PartResponse, SiteResponse } from '../api/types';
import type { PickerOption } from './forms/RecordPicker';
import { LinkCell, TextCell } from './table/cells';
import type { Column } from './table/DataTable';
import { Badge } from './ui/Badge';

/** Columns for parts shown inside a relationship tab (Item → Parts, Site → Parts). */
export function partColumns({ withItem = false } = {}): Column<PartResponse>[] {
  const columns: Column<PartResponse>[] = [
    {
      key: 'partNumber',
      header: 'Part Number',
      className: 'whitespace-nowrap',
      render: (p) => <LinkCell to={`/parts/${p.id}`}>{p.partNumber}</LinkCell>,
    },
    { key: 'partName', header: 'Part Name', render: (p) => <TextCell value={p.partName} /> },
    { key: 'manufactureName', header: 'Manufacturer', render: (p) => <TextCell value={p.manufactureName} /> },
    { key: 'lifeCyclePhase', header: 'Status', render: (p) => <Badge value={p.lifeCyclePhase} /> },
  ];
  if (withItem) columns.push(itemColumn());
  return columns;
}

/** "Item" column linking a part's parent item (muted dash when unassigned). */
export function itemColumn(): Column<PartResponse> {
  return {
    key: 'item',
    header: 'Item',
    className: 'whitespace-nowrap',
    render: (p) =>
      p.itemId ? <LinkCell to={`/items/${p.itemId}`}>{p.itemNumber}</LinkCell> : <TextCell value={null} />,
  };
}

/** Columns for sites shown inside a relationship tab (Part → Sites). */
export function siteColumns(): Column<SiteResponse>[] {
  return [
    {
      key: 'siteName',
      header: 'Site Name',
      render: (s) => <LinkCell to={`/sites/${s.id}`}>{s.siteName}</LinkCell>,
    },
    { key: 'siteType', header: 'Site Type', render: (s) => <TextCell value={s.siteType} /> },
    { key: 'workcenter', header: 'Workcenter', render: (s) => <TextCell value={s.workcenter} /> },
    { key: 'address', header: 'Address', render: (s) => <TextCell value={s.address} wrap /> },
  ];
}

export const partOption = (p: PartResponse): PickerOption => ({ id: p.id, code: p.partNumber, name: p.partName });
export const siteOption = (s: SiteResponse): PickerOption => ({ id: s.id, code: s.siteName, name: s.workcenter });
