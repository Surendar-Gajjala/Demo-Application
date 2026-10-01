import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ApiError } from '../api/client';
import type { ItemResponse, PartResponse } from '../api/types';
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

function Location() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname + location.search}</output>;
}

function renderAt(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/items/:id" element={<ItemDetailPage />} />
        </Routes>
        <Location />
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

  it('has Overview, BOM and Parts tabs; Parts lists the item parts and the tab is kept in ?tab=', async () => {
    vi.spyOn(itemsApi, 'get').mockResolvedValue(item);
    const parts = vi.spyOn(itemsApi, 'parts').mockResolvedValue({
      content: [part],
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
    });
    renderAt('/items/7');

    const overview = await screen.findByRole('tab', { name: 'Overview' }, { timeout: 5000 });
    expect(overview).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'BOM' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Parts' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/items/7?tab=parts');
    expect(await screen.findByRole('link', { name: 'A-2041' }, { timeout: 5000 })).toHaveAttribute(
      'href',
      '/parts/3',
    );
    expect(parts).toHaveBeenCalledWith(7, { search: '', page: 0, size: 20 });
    expect(screen.queryByRole('heading', { name: 'General' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Add Part' })).toBeInTheDocument();
  });

  it('opens the tab named in the URL', async () => {
    vi.spyOn(itemsApi, 'get').mockResolvedValue(item);
    vi.spyOn(itemsApi, 'parts').mockResolvedValue({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 });
    renderAt('/items/7?tab=parts');

    expect(await screen.findByRole('tab', { name: 'Parts' }, { timeout: 5000 })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(await screen.findByText('No parts yet', {}, { timeout: 5000 })).toBeInTheDocument();
  });

  it('shows the backend error for an unknown id', async () => {
    vi.spyOn(itemsApi, 'get').mockRejectedValue(new ApiError(404, 'Not found', 'Item 999 not found'));
    renderAt('/items/999');
    expect(await screen.findByText('Item 999 not found', {}, { timeout: 5000 })).toBeInTheDocument();
  });
});
