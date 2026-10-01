import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { SiteResponse } from '../api/types';
import { RelatedList } from './RelatedList';
import { siteColumns } from './relatedColumns';
import { ToastProvider } from './ui/Toast';

const site = (id: number, siteName: string): SiteResponse => ({
  id,
  siteName,
  siteType: 'Plant',
  workcenter: 'WC-00' + id,
  address: null,
  createdAt: '2026-10-01T10:00:00Z',
  updatedAt: '2026-10-01T10:00:00Z',
});

function setup() {
  const list = vi.fn().mockResolvedValue({
    content: [site(1, 'Hyderabad Plant')],
    page: 0,
    size: 20,
    totalElements: 1,
    totalPages: 1,
  });
  const candidates = vi.fn().mockResolvedValue([{ id: 2, code: 'Pune Test Center', name: 'WC-004' }]);
  const onAdd = vi.fn().mockResolvedValue(undefined);
  const onRemove = vi.fn().mockResolvedValue(undefined);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter>
          <RelatedList
            entityName="Site"
            contextLabel="A-2041"
            queryKey={['sites', 'byPart', 3]}
            list={list}
            columns={siteColumns()}
            rowLabel={(s) => s.siteName}
            searchPlaceholder="Search sites..."
            candidates={candidates}
            candidatesEmptyText="No more sites to add"
            onAdd={onAdd}
            onRemove={onRemove}
            removeNote="The site itself is not deleted."
          />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
  return { list, candidates, onAdd, onRemove };
}

describe('RelatedList', () => {
  it('lists linked records with links to their details', async () => {
    const { list } = setup();
    expect(await screen.findByRole('link', { name: 'Hyderabad Plant' }, { timeout: 5000 })).toHaveAttribute(
      'href',
      '/sites/1',
    );
    expect(list).toHaveBeenCalledWith({ search: '', page: 0, size: 20 });
  });

  it('adds an existing record picked from the dropdown and shows a success message', async () => {
    const { candidates, onAdd } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Add Site' }));
    const dialog = await screen.findByRole('dialog');

    await userEvent.click(within(dialog).getByRole('combobox'));
    await userEvent.click(
      await within(dialog).findByRole('option', { name: /Pune Test Center/ }, { timeout: 5000 }),
    );
    expect(candidates).toHaveBeenCalledWith('');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add Site' }));

    expect(onAdd).toHaveBeenCalledWith(2);
    expect(await screen.findByRole('status')).toHaveTextContent('Site Pune Test Center added to A-2041');
  });

  it('requires a selection before adding', async () => {
    const { onAdd } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Add Site' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add Site' }));

    expect(within(dialog).getByText('Select a site')).toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('removes (unlinks) a row after confirmation', async () => {
    const { onRemove } = setup();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Remove Hyderabad Plant from A-2041' }, { timeout: 5000 }),
    );
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Remove Hyderabad Plant from A-2041? The site itself is not deleted.');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Remove' }));

    expect(onRemove).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
    expect(await screen.findByRole('status')).toHaveTextContent('Site Hyderabad Plant removed from A-2041');
  });
});
