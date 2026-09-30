import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import type { BomNode } from '../../api/types';
import { INDENT_PX, TreeTable, type TreeTableHandle } from './TreeTable';

function node(itemId: number, itemNumber: string, level: number, extra: Partial<BomNode> = {}): BomNode {
  return {
    bomId: level === 0 ? null : itemId * 10,
    itemId,
    itemNumber,
    itemName: `${itemNumber} name`,
    description: null,
    type: 'ASSEMBLY',
    lifeCyclePhase: 'DESIGN',
    quantity: level === 0 ? null : 2,
    sequence: level === 0 ? null : 10,
    level,
    hasChildren: false,
    children: [],
    ...extra,
  };
}

const prod = node(1, 'PROD-001', 0, { type: 'FINISHED', hasChildren: true });
const assembly = node(2, 'ASSEMBLY-001', 1, { hasChildren: true });
const item = node(3, 'ITEM-0001', 2);

function cellOf(text: string) {
  return screen.getByText(text).closest('td') as HTMLTableCellElement;
}

describe('TreeTable', () => {
  it('lazy-loads children on expand, indents them, and collapses', async () => {
    const loadChildren = vi.fn(async (id: number) => (id === 1 ? [assembly] : [item]));
    render(<TreeTable roots={[prod]} loadChildren={loadChildren} loadSubtree={vi.fn()} />);

    expect(screen.queryByText('ASSEMBLY-001')).not.toBeInTheDocument();
    expect(within(cellOf('PROD-001').closest('tr')!).getByText('Finished')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Expand PROD-001' }));
    expect(await screen.findByText('ASSEMBLY-001')).toBeInTheDocument();
    expect(loadChildren).toHaveBeenCalledWith(1);
    expect(cellOf('ASSEMBLY-001').style.paddingLeft).toBe(`${32 + INDENT_PX}px`);

    await userEvent.click(screen.getByRole('button', { name: 'Expand ASSEMBLY-001' }));
    expect(await screen.findByText('ITEM-0001')).toBeInTheDocument();
    expect(cellOf('ITEM-0001').style.paddingLeft).toBe(`${32 + 2 * INDENT_PX}px`);
    // leaf rows have no expand button
    expect(screen.queryByRole('button', { name: /ITEM-0001/ })).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Collapse PROD-001' }));
    expect(screen.queryByText('ASSEMBLY-001')).not.toBeInTheDocument();

    // re-expanding uses the cache
    await userEvent.click(screen.getByRole('button', { name: 'Expand PROD-001' }));
    expect(screen.getByText('ASSEMBLY-001')).toBeInTheDocument();
    expect(loadChildren).toHaveBeenCalledTimes(2);
  });

  it('shows the error when loading children fails', async () => {
    const loadChildren = vi.fn().mockRejectedValue(new Error('Item 1 not found'));
    render(<TreeTable roots={[prod]} loadChildren={loadChildren} loadSubtree={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Expand PROD-001' }));
    expect(await screen.findByText('Item 1 not found')).toBeInTheDocument();
  });

  it('renders row actions and the header action in a leading column', async () => {
    const renderActions = vi.fn((n: BomNode, rowKey: string) => (
      <button type="button">{`Add under ${n.itemNumber} @ ${rowKey}`}</button>
    ));
    render(
      <TreeTable
        roots={[prod]}
        loadChildren={vi.fn()}
        loadSubtree={vi.fn()}
        renderActions={renderActions}
        headerAction={<button type="button">Add at top</button>}
      />,
    );
    expect(screen.queryByRole('columnheader', { name: 'Actions' })).toBeNull();
    const [actionHeader, itemHeader] = screen.getAllByRole('columnheader');
    expect(within(actionHeader).getByRole('button', { name: 'Add at top' })).toBeInTheDocument();
    expect(itemHeader).toHaveTextContent('Item Number');
    const actionCell = cellOf('PROD-001').previousElementSibling as HTMLElement;
    expect(within(actionCell).getByRole('button', { name: 'Add under PROD-001 @ /r1' })).toBeInTheDocument();
  });

  it('reloadChildren shows a new child and expands a former leaf', async () => {
    const leafRoot = node(9, 'LEAF-1', 0);
    const newChild = node(10, 'NEW-1', 1);
    const loadChildren = vi.fn().mockResolvedValue([newChild]);
    const ref = createRef<TreeTableHandle>();
    render(<TreeTable ref={ref} roots={[leafRoot]} loadChildren={loadChildren} loadSubtree={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'Expand LEAF-1' })).toBeNull();
    await act(() => ref.current!.reloadChildren(9, '/r9'));

    expect(loadChildren).toHaveBeenCalledWith(9);
    expect(screen.getByText('NEW-1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Collapse LEAF-1' })).toBeInTheDocument();
  });

  it('expandAll opens the whole subtree from one explosion call', async () => {
    const tree = { ...prod, children: [{ ...assembly, children: [item] }] };
    const loadSubtree = vi.fn().mockResolvedValue(tree);
    const ref = createRef<TreeTableHandle>();
    render(<TreeTable ref={ref} roots={[prod]} loadChildren={vi.fn()} loadSubtree={loadSubtree} />);

    await act(() => ref.current!.expandAll());
    expect(screen.getByText('ITEM-0001')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Collapse ASSEMBLY-001' })).toBeInTheDocument();

    act(() => ref.current!.collapseAll());
    expect(screen.queryByText('ASSEMBLY-001')).not.toBeInTheDocument();
  });
});
