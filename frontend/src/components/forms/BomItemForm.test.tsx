import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { bomApi } from '../../api/bom';
import { ApiError } from '../../api/client';
import type { BomNode, ItemResponse } from '../../api/types';
import { BomItemForm } from './BomItemForm';

const parent: BomNode = {
  bomId: null,
  itemId: 1,
  itemNumber: 'PROD-001',
  itemName: 'Product 001',
  description: null,
  type: 'FINISHED',
  lifeCyclePhase: 'PRODUCTION',
  quantity: null,
  sequence: null,
  level: 0,
  hasChildren: true,
  children: [],
};

const candidate = (id: number, itemNumber: string): ItemResponse => ({
  id,
  itemNumber,
  itemName: `${itemNumber} name`,
  description: null,
  type: 'ASSEMBLY',
  lifeCyclePhase: 'DESIGN',
  productFamily: null,
  createdAt: '2026-09-29T11:00:00Z',
  updatedAt: '2026-09-29T11:00:00Z',
});

function setup(onSubmit = vi.fn().mockResolvedValue(undefined), withParent = true) {
  vi.spyOn(bomApi, 'candidates').mockResolvedValue({
    content: [candidate(16, 'ITEM-0004'), candidate(20, 'ITEM-0008')],
    page: 0,
    size: 20,
    totalElements: 2,
    totalPages: 1,
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <BomItemForm parent={withParent ? parent : undefined} onSubmit={onSubmit} onCancel={() => {}} />
    </QueryClientProvider>,
  );
  return onSubmit;
}

afterEach(() => vi.restoreAllMocks());

describe('BomItemForm', () => {
  it('adds the picked item with the quantity under the parent', async () => {
    const onSubmit = setup();
    expect(screen.getByText('PROD-001')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(await screen.findByRole('option', { name: /ITEM-0004/ }, { timeout: 5000 }));
    expect(bomApi.candidates).toHaveBeenCalledWith(1, { search: '', size: 20 });
    expect(screen.getByRole('combobox')).toHaveValue('ITEM-0004 · ITEM-0004 name');

    const quantity = screen.getByRole('spinbutton');
    await userEvent.clear(quantity);
    await userEvent.type(quantity, '2.5');
    await userEvent.click(screen.getByRole('button', { name: 'Add BOM' }));

    expect(onSubmit).toHaveBeenCalledWith(1, { childId: 16, quantity: 2.5 });
  });

  it('without a parent, picks the parent from the top-level (BOM root) items first', async () => {
    const roots = vi.spyOn(bomApi, 'roots').mockResolvedValue({
      content: [{ ...parent, itemId: 7, itemNumber: 'PROD-007', itemName: 'Product 007' }],
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
    });
    const onSubmit = setup(undefined, false);
    const [parentBox, itemBox] = screen.getAllByRole('combobox');
    expect(itemBox).toBeDisabled();

    await userEvent.click(parentBox);
    await userEvent.click(await screen.findByRole('option', { name: /PROD-007/ }, { timeout: 5000 }));
    expect(roots).toHaveBeenCalledWith({ search: '', size: 20 });
    // The Item picker remounts for the new parent.
    const itemBoxAfter = screen.getAllByRole('combobox')[1];
    expect(itemBoxAfter).toBeEnabled();

    await userEvent.click(itemBoxAfter);
    await userEvent.click(await screen.findByRole('option', { name: /ITEM-0008/ }, { timeout: 5000 }));
    expect(bomApi.candidates).toHaveBeenCalledWith(7, { search: '', size: 20 });
    await userEvent.click(screen.getByRole('button', { name: 'Add BOM' }));

    expect(onSubmit).toHaveBeenCalledWith(7, { childId: 20, quantity: 1 });
  });

  it('requires an item and a positive quantity', async () => {
    const onSubmit = setup();
    const quantity = screen.getByRole('spinbutton');
    await userEvent.clear(quantity);
    await userEvent.type(quantity, '0');
    await userEvent.click(screen.getByRole('button', { name: 'Add BOM' }));

    expect(await screen.findByText('Select an item')).toBeInTheDocument();
    expect(screen.getByText('Quantity must be greater than 0')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows a 409 (duplicate or cycle) under the Item field', async () => {
    setup(vi.fn().mockRejectedValue(new ApiError(409, 'Conflict', 'ITEM-0004 is already in the BOM of PROD-001')));

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(await screen.findByRole('option', { name: /ITEM-0004/ }, { timeout: 5000 }));
    await userEvent.click(screen.getByRole('button', { name: 'Add BOM' }));

    expect(await screen.findByText('ITEM-0004 is already in the BOM of PROD-001')).toBeInTheDocument();
  });
});
