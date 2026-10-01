import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { itemsApi } from '../../api/items';
import type { ItemResponse, PartResponse } from '../../api/types';
import { PartForm } from './PartForm';

const item: ItemResponse = {
  id: 7,
  itemNumber: 'PROD-001',
  itemName: 'Product 001',
  description: null,
  type: 'FINISHED',
  lifeCyclePhase: 'PRODUCTION',
  productFamily: 'Laptop',
  createdAt: '2026-09-29T11:09:07Z',
  updatedAt: '2026-09-29T11:09:07Z',
};

const part: PartResponse = {
  id: 3,
  partNumber: 'A-2041',
  partName: 'Voltage Regulator',
  description: null,
  manufactureName: 'Linear Technology',
  lifeCyclePhase: 'PRODUCTION',
  itemId: 7,
  itemNumber: 'PROD-001',
  itemName: 'Product 001',
  createdAt: '2026-09-29T11:09:07Z',
  updatedAt: '2026-09-29T11:09:07Z',
};

function renderForm(initial?: PartResponse) {
  vi.spyOn(itemsApi, 'list').mockResolvedValue({
    content: [item],
    page: 0,
    size: 20,
    totalElements: 1,
    totalPages: 1,
  });
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <PartForm initial={initial} onSubmit={onSubmit} onCancel={() => {}} />
    </QueryClientProvider>,
  );
  return onSubmit;
}

afterEach(() => vi.restoreAllMocks());

describe('PartForm', () => {
  it('sends the picked parent item', async () => {
    const onSubmit = renderForm();
    await userEvent.type(screen.getByLabelText(/Part Number/), 'P-1');
    await userEvent.type(screen.getByLabelText(/Part Name/), 'Gasket');
    await userEvent.click(screen.getByRole('combobox', { name: 'Item' }));
    await userEvent.click(await screen.findByRole('option', { name: /PROD-001/ }, { timeout: 5000 }));
    await userEvent.click(screen.getByRole('button', { name: 'Add Part' }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ partNumber: 'P-1', itemId: 7 }));
  });

  it('prefills the item when editing and sends null once it is cleared', async () => {
    const onSubmit = renderForm(part);
    const picker = screen.getByRole('combobox', { name: 'Item' });
    expect(picker).toHaveValue('PROD-001 · Product 001');

    await userEvent.clear(picker);
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ partNumber: 'A-2041', itemId: null }));
  });
});
