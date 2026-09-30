import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination, pageItems } from './Pagination';

describe('pageItems', () => {
  it('lists all pages when there are few', () => {
    expect(pageItems(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('matches the reference footer at the start: 1 2 3 … 97', () => {
    expect(pageItems(1, 97)).toEqual([1, 2, 3, 4, '…', 97]);
  });

  it('shows neighbours with gaps in the middle and at the end', () => {
    expect(pageItems(50, 97)).toEqual([1, '…', 49, 50, 51, '…', 97]);
    expect(pageItems(97, 97)).toEqual([1, '…', 94, 95, 96, 97]);
  });
});

describe('Pagination', () => {
  const base = { page: 0, size: 25, totalElements: 2409, totalPages: 97 };

  it('renders range and total without timing', () => {
    render(<Pagination {...base} onPageChange={() => {}} onSizeChange={() => {}} />);
    expect(screen.getByText('1–25')).toBeInTheDocument();
    expect(screen.getByText('2,409')).toBeInTheDocument();
    expect(screen.queryByText(/ ms$/)).toBeNull();
    expect(screen.getByRole('button', { name: '1' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
  });

  it('reports 0-based page changes and size changes', async () => {
    const onPageChange = vi.fn();
    const onSizeChange = vi.fn();
    render(<Pagination {...base} onPageChange={onPageChange} onSizeChange={onSizeChange} />);

    await userEvent.click(screen.getByRole('button', { name: '97' }));
    expect(onPageChange).toHaveBeenLastCalledWith(96);

    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onPageChange).toHaveBeenLastCalledWith(1);

    await userEvent.type(screen.getByLabelText('Go to page'), '12{enter}');
    expect(onPageChange).toHaveBeenLastCalledWith(11);

    await userEvent.selectOptions(screen.getByRole('combobox'), '100');
    expect(onSizeChange).toHaveBeenCalledWith(100);
  });
});
