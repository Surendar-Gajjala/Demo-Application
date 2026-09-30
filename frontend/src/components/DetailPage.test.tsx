import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ApiError } from '../api/client';
import type { ItemResponse } from '../api/types';
import { ItemDetailPage } from '../pages/ItemDetailPage';
import { itemsApi } from '../api/items';

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

function renderAt(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/items/:id" element={<ItemDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => vi.restoreAllMocks());

describe('ItemDetailPage', () => {
  it('shows "← PROD-001" with a back link to Items and the General card', async () => {
    const get = vi.spyOn(itemsApi, 'get').mockResolvedValue(item);
    renderAt('/items/7');

    // First render imports the whole page; allow for a slow machine.
    expect(
      await screen.findByRole('heading', { level: 1, name: 'PROD-001' }, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(get).toHaveBeenCalledWith(7);
    expect(screen.getByRole('link', { name: 'Back to Items' })).toHaveAttribute('href', '/items');
    expect(screen.getByRole('heading', { name: 'General' })).toBeInTheDocument();

    const value = (label: string) => screen.getByText(label).nextElementSibling;
    expect(value('Item Name')).toHaveTextContent('Product 001');
    expect(value('Product Family')).toHaveTextContent('Laptop');
    expect(value('Item Type')).toHaveTextContent('Finished');
    expect(value('Item Status')).toHaveTextContent('Production');
    expect(value('Description')).toHaveTextContent('—');
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
  });

  it('shows the backend error for an unknown id', async () => {
    vi.spyOn(itemsApi, 'get').mockRejectedValue(new ApiError(404, 'Not found', 'Item 999 not found'));
    renderAt('/items/999');
    expect(await screen.findByText('Item 999 not found', {}, { timeout: 5000 })).toBeInTheDocument();
  });
});
