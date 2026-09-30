import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  it('shows the clear button only when there is text', async () => {
    render(<SearchBar value="" onChange={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();

    await userEvent.type(screen.getByRole('searchbox'), 'prod');
    expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument();
  });

  it('clears the input and reports an empty search immediately', async () => {
    const onChange = vi.fn();
    render(<SearchBar value="PROD-001" onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(onChange).toHaveBeenCalledWith('');
    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
  });
});
