import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InlineSearchSelect } from './inline-search-select';

const baseProps = {
  label: 'Provincia',
  searchTerm: '',
  onSearchTermChange: jest.fn(),
  selected: '',
  options: ['La Habana', 'Matanzas'] as const,
  onSelect: jest.fn(),
  isOpen: false,
  onOpenChange: jest.fn(),
  placeholder: 'Buscar provincia...',
  emptyMessage: 'No se encontraron provincias',
  isDark: false,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('InlineSearchSelect', () => {
  it('renders the label and the input with the placeholder', () => {
    render(<InlineSearchSelect {...baseProps} />);
    expect(screen.getByText('Provincia')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Buscar provincia...')).toBeInTheDocument();
  });

  it('keeps the dropdown hidden when isOpen=false', () => {
    render(<InlineSearchSelect {...baseProps} />);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('shows the dropdown and the options when isOpen=true', () => {
    render(<InlineSearchSelect {...baseProps} isOpen options={['La Habana', 'Matanzas']} />);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'La Habana' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Matanzas' })).toBeInTheDocument();
  });

  it('shows the empty message when isOpen=true and options=[]', () => {
    render(<InlineSearchSelect {...baseProps} isOpen options={[]} />);
    expect(screen.getByText('No se encontraron provincias')).toBeInTheDocument();
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('calls onSearchTermChange and onOpenChange when the user types', async () => {
    const onSearchTermChange = jest.fn();
    const onOpenChange = jest.fn();
    render(
      <InlineSearchSelect
        {...baseProps}
        onSearchTermChange={onSearchTermChange}
        onOpenChange={onOpenChange}
      />,
    );

    await userEvent.type(screen.getByRole('combobox'), 'Ma');
    expect(onSearchTermChange).toHaveBeenCalledWith('M');
    expect(onSearchTermChange).toHaveBeenCalledWith('a');
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('calls onOpenChange(true) on focus when not disabled', async () => {
    const onOpenChange = jest.fn();
    render(
      <InlineSearchSelect {...baseProps} onOpenChange={onOpenChange} />,
    );
    await userEvent.click(screen.getByRole('combobox'));
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('does NOT open the dropdown on focus when disabled', async () => {
    const onOpenChange = jest.fn();
    render(
      <InlineSearchSelect {...baseProps} disabled onOpenChange={onOpenChange} />,
    );
    await userEvent.click(screen.getByRole('combobox'));
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('disables the input when disabled=true', () => {
    render(<InlineSearchSelect {...baseProps} disabled />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('hides the dropdown when disabled even if isOpen=true', () => {
    render(<InlineSearchSelect {...baseProps} disabled isOpen />);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('calls onSelect(option) when clicking an option', async () => {
    const onSelect = jest.fn();
    render(
      <InlineSearchSelect
        {...baseProps}
        isOpen
        onSelect={onSelect}
      />,
    );
    await userEvent.click(screen.getByRole('option', { name: 'La Habana' }));
    expect(onSelect).toHaveBeenCalledWith('La Habana');
  });

  it('marks the selected option with aria-selected=true', () => {
    render(
      <InlineSearchSelect {...baseProps} isOpen selected="La Habana" />,
    );
    expect(
      screen.getByRole('option', { name: 'La Habana' }),
    ).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('option', { name: 'Matanzas' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('closes the dropdown on click outside', () => {
    const onOpenChange = jest.fn();
    render(
      <div>
        <InlineSearchSelect
          {...baseProps}
          isOpen
          onOpenChange={onOpenChange}
        />
        <button data-testid="outside">Click outside</button>
      </div>,
    );
    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('does NOT close when clicking inside the component', () => {
    const onOpenChange = jest.fn();
    render(
      <InlineSearchSelect {...baseProps} isOpen onOpenChange={onOpenChange} />,
    );
    fireEvent.mouseDown(screen.getByRole('listbox'));
    // No false call — el listener verifica containment del clic
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it('has correct ARIA semantics (combobox + aria-expanded + listbox link)', () => {
    render(
      <InlineSearchSelect {...baseProps} isOpen testId="province-select" />,
    );
    const combobox = screen.getByRole('combobox');
    expect(combobox).toHaveAttribute('aria-expanded', 'true');
    expect(combobox).toHaveAttribute('aria-controls', 'province-select-listbox');
    expect(screen.getByRole('listbox')).toHaveAttribute(
      'id',
      'province-select-listbox',
    );
  });
});
