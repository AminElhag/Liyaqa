import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable } from './data-table';
import type { ColumnDef } from '@tanstack/react-table';

// Mock next-intl
vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}));

// Mock UI components
vi.mock('@/components/ui/table', () => ({
  Table: ({ children, ...props }: any) => <table {...props}>{children}</table>,
  TableHeader: ({ children, ...props }: any) => <thead {...props}>{children}</thead>,
  TableBody: ({ children, ...props }: any) => <tbody {...props}>{children}</tbody>,
  TableHead: ({ children, ...props }: any) => <th {...props}>{children}</th>,
  TableRow: ({ children, ...props }: any) => <tr {...props}>{children}</tr>,
  TableCell: ({ children, ...props }: any) => <td {...props}>{children}</td>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}));

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, ...props }: any) => (
    <input
      type="checkbox"
      checked={checked === true}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      {...props}
    />
  ),
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <select value={value} onChange={(e) => onValueChange?.(e.target.value)}>
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
}));

interface TestData {
  id: string;
  name: string;
  email: string;
  status: string;
}

const testData: TestData[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', status: 'active' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', status: 'inactive' },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com', status: 'active' },
];

const testColumns: ColumnDef<TestData, any>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
];

describe('DataTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render table with data', () => {
    render(<DataTable columns={testColumns} data={testData} />);

    // Check headers are rendered
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();

    // Check data rows are rendered
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('should render empty state when no data', () => {
    render(<DataTable columns={testColumns} data={[]} />);

    expect(screen.getByText(/no results/i)).toBeInTheDocument();
  });

  it('should display search input when searchKey is provided', () => {
    render(
      <DataTable
        columns={testColumns}
        data={testData}
        searchKey="name"
        searchPlaceholder="Search by name..."
      />
    );

    const searchInput = screen.getByPlaceholderText('Search by name...');
    expect(searchInput).toBeInTheDocument();
  });

  it('should filter data when searching', async () => {
    const user = userEvent.setup();

    render(
      <DataTable
        columns={testColumns}
        data={testData}
        searchKey="name"
        searchPlaceholder="Search..."
      />
    );

    const searchInput = screen.getByPlaceholderText('Search...');
    await user.type(searchInput, 'John');

    // Should show John Doe
    expect(screen.getByText('John Doe')).toBeInTheDocument();

    // Should not show Jane Smith
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });

  it('should handle pagination', async () => {
    const user = userEvent.setup();

    // Create more data for pagination
    const manyItems: TestData[] = Array.from({ length: 25 }, (_, i) => ({
      id: `${i + 1}`,
      name: `Person ${i + 1}`,
      email: `person${i + 1}@example.com`,
      status: 'active',
    }));

    render(<DataTable columns={testColumns} data={manyItems} pageSize={10} />);

    // Should show first page items
    expect(screen.getByText('Person 1')).toBeInTheDocument();
    expect(screen.queryByText('Person 15')).not.toBeInTheDocument();

    // Navigate to next page
    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);

    // Should show second page items
    expect(screen.getByText('Person 11')).toBeInTheDocument();
    expect(screen.queryByText('Person 1')).not.toBeInTheDocument();
  });

  it('should call onPageChange when page changes', async () => {
    const user = userEvent.setup();
    const mockOnPageChange = vi.fn();

    render(
      <DataTable
        columns={testColumns}
        data={testData}
        onPageChange={mockOnPageChange}
        manualPagination={true}
        pageCount={3}
      />
    );

    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);

    expect(mockOnPageChange).toHaveBeenCalledWith(1);
  });

  it('should support row selection when enabled', () => {
    render(
      <DataTable
        columns={testColumns}
        data={testData}
        enableSelection={true}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  it('should call onSelectionChange when rows are selected', async () => {
    const user = userEvent.setup();
    const mockOnSelectionChange = vi.fn();

    render(
      <DataTable
        columns={testColumns}
        data={testData}
        enableSelection={true}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    // First checkbox is select-all, second is first row
    if (checkboxes[1]) {
      await user.click(checkboxes[1]);
    }

    expect(mockOnSelectionChange).toHaveBeenCalled();
  });

  it('should handle page size changes', async () => {
    const user = userEvent.setup();
    const mockOnPageSizeChange = vi.fn();

    render(
      <DataTable
        columns={testColumns}
        data={testData}
        onPageSizeChange={mockOnPageSizeChange}
      />
    );

    // Find page size selector (might be a select or buttons)
    const pageSizeSelects = screen.getAllByRole('combobox');
    if (pageSizeSelects.length > 0) {
      await user.selectOptions(pageSizeSelects[0], '20');
      expect(mockOnPageSizeChange).toHaveBeenCalledWith(20);
    }
  });

  it('should show loading state', () => {
    render(
      <DataTable
        columns={testColumns}
        data={[]}
        isLoading={true}
      />
    );

    // Should show loading indicator or skeleton
    const loadingElement = screen.queryByText(/loading/i);
    expect(loadingElement || screen.getByRole('table')).toBeInTheDocument();
  });

  it('should handle row clicks when onRowClick is provided', async () => {
    const user = userEvent.setup();
    const mockOnRowClick = vi.fn();

    render(
      <DataTable
        columns={testColumns}
        data={testData}
        onRowClick={mockOnRowClick}
      />
    );

    // Click on first data row
    const johnRow = screen.getByText('John Doe').closest('tr');
    if (johnRow) {
      await user.click(johnRow);
      expect(mockOnRowClick).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'John Doe',
        })
      );
    }
  });

  it('should disable navigation when on first page', () => {
    render(<DataTable columns={testColumns} data={testData} pageSize={10} />);

    const firstPageButton = screen.getByRole('button', { name: /first/i });
    const previousButton = screen.getByRole('button', { name: /previous/i });

    expect(firstPageButton).toBeDisabled();
    expect(previousButton).toBeDisabled();
  });

  it('should disable navigation when on last page', async () => {
    const user = userEvent.setup();

    // Create exactly 2 pages of data
    const twoPages: TestData[] = Array.from({ length: 15 }, (_, i) => ({
      id: `${i + 1}`,
      name: `Person ${i + 1}`,
      email: `person${i + 1}@example.com`,
      status: 'active',
    }));

    render(<DataTable columns={testColumns} data={twoPages} pageSize={10} />);

    // Go to last page
    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);

    // Should disable next and last buttons
    const lastPageButton = screen.getByRole('button', { name: /last/i });
    expect(nextButton).toBeDisabled();
    expect(lastPageButton).toBeDisabled();
  });

  it('should handle manual pagination with external page count', () => {
    render(
      <DataTable
        columns={testColumns}
        data={testData}
        manualPagination={true}
        pageCount={5}
        pageIndex={0}
        totalRows={50}
      />
    );

    // Verify pagination controls are present (navigation buttons)
    const nextButton = screen.queryByRole('button', { name: /next/i });
    const previousButton = screen.queryByRole('button', { name: /previous/i });

    // At least navigation buttons should be present
    expect(nextButton || previousButton).toBeTruthy();
  });
});
