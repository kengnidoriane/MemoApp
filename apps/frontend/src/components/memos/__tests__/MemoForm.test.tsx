import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, createMockMemo, createMockCategory } from '../../../test/utils';
import { MemoForm } from '../MemoForm';

// Mock the memo service
vi.mock('../../../services/memoService', () => ({
  memoService: {
    createMemo: vi.fn(),
    updateMemo: vi.fn(),
  },
}));

// Mock the category service
vi.mock('../../../services/categoryService', () => ({
  categoryService: {
    getCategories: vi.fn(),
  },
}));

// Mock the stores
vi.mock('../../../stores/memoStore', () => ({
  useMemoStore: vi.fn(() => ({
    createMemo: vi.fn(),
    updateMemo: vi.fn(),
    isLoading: false,
    error: null,
  })),
}));

vi.mock('../../../stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: 'user-1' },
  })),
}));

const mockOnSuccess = vi.fn();
const mockOnCancel = vi.fn();

describe('MemoForm', () => {
  const mockCategories = [
    createMockCategory({ id: 'cat-1', name: 'Work' }),
    createMockCategory({ id: 'cat-2', name: 'Personal' }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    const { categoryService } = require('../../../services/categoryService');
    categoryService.getCategories.mockResolvedValue(mockCategories);
  });

  it('renders create form with all required fields', async () => {
    render(<MemoForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/content/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tags/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create memo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('renders edit form with existing memo data', async () => {
    const existingMemo = createMockMemo({
      title: 'Existing Memo',
      content: 'Existing content',
      tags: ['existing', 'memo'],
      categoryId: 'cat-1',
    });

    render(
      <MemoForm 
        memo={existingMemo} 
        onSuccess={mockOnSuccess} 
        onCancel={mockOnCancel} 
      />
    );

    expect(screen.getByDisplayValue('Existing Memo')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing content')).toBeInTheDocument();
    expect(screen.getByDisplayValue('existing, memo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update memo/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(<MemoForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const submitButton = screen.getByRole('button', { name: /create memo/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      expect(screen.getByText(/content is required/i)).toBeInTheDocument();
    });
  });

  it('validates title length', async () => {
    const user = userEvent.setup();
    render(<MemoForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'a'.repeat(501)); // Exceed max length

    const submitButton = screen.getByRole('button', { name: /create memo/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/title must be 500 characters or less/i)).toBeInTheDocument();
    });
  });

  it('validates content length', async () => {
    const user = userEvent.setup();
    render(<MemoForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const contentInput = screen.getByLabelText(/content/i);
    await user.type(contentInput, 'a'.repeat(10001)); // Exceed max length

    const submitButton = screen.getByRole('button', { name: /create memo/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/content must be 10000 characters or less/i)).toBeInTheDocument();
    });
  });

  it('creates new memo with valid data', async () => {
    const user = userEvent.setup();
    const mockCreateMemo = vi.fn().mockResolvedValue({ id: 'new-memo' });
    const { useMemoStore } = require('../../../stores/memoStore');
    useMemoStore.mockReturnValue({
      createMemo: mockCreateMemo,
      isLoading: false,
      error: null,
    });

    render(<MemoForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    // Fill form
    await user.type(screen.getByLabelText(/title/i), 'New Memo');
    await user.type(screen.getByLabelText(/content/i), 'New memo content');
    await user.type(screen.getByLabelText(/tags/i), 'tag1, tag2');
    
    // Select category
    const categorySelect = screen.getByLabelText(/category/i);
    await user.selectOptions(categorySelect, 'cat-1');

    // Submit form
    await user.click(screen.getByRole('button', { name: /create memo/i }));

    await waitFor(() => {
      expect(mockCreateMemo).toHaveBeenCalledWith({
        title: 'New Memo',
        content: 'New memo content',
        tags: ['tag1', 'tag2'],
        categoryId: 'cat-1',
      });
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('updates existing memo with valid data', async () => {
    const user = userEvent.setup();
    const existingMemo = createMockMemo();
    const mockUpdateMemo = vi.fn().mockResolvedValue(existingMemo);
    const { useMemoStore } = require('../../../stores/memoStore');
    useMemoStore.mockReturnValue({
      updateMemo: mockUpdateMemo,
      isLoading: false,
      error: null,
    });

    render(
      <MemoForm 
        memo={existingMemo} 
        onSuccess={mockOnSuccess} 
        onCancel={mockOnCancel} 
      />
    );

    // Update title
    const titleInput = screen.getByLabelText(/title/i);
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Memo');

    // Submit form
    await user.click(screen.getByRole('button', { name: /update memo/i }));

    await waitFor(() => {
      expect(mockUpdateMemo).toHaveBeenCalledWith(existingMemo.id, {
        title: 'Updated Memo',
        content: existingMemo.content,
        tags: existingMemo.tags,
        categoryId: existingMemo.categoryId,
      });
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('handles tag input correctly', async () => {
    const user = userEvent.setup();
    render(<MemoForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const tagInput = screen.getByLabelText(/tags/i);
    
    // Test comma-separated tags
    await user.type(tagInput, 'tag1, tag2, tag3');
    expect(tagInput).toHaveValue('tag1, tag2, tag3');

    // Test tag trimming
    await user.clear(tagInput);
    await user.type(tagInput, ' tag1 , tag2 , tag3 ');
    
    // Fill other required fields and submit to test tag processing
    await user.type(screen.getByLabelText(/title/i), 'Test');
    await user.type(screen.getByLabelText(/content/i), 'Test content');
    
    const mockCreateMemo = vi.fn();
    const { useMemoStore } = require('../../../stores/memoStore');
    useMemoStore.mockReturnValue({
      createMemo: mockCreateMemo,
      isLoading: false,
      error: null,
    });

    await user.click(screen.getByRole('button', { name: /create memo/i }));

    await waitFor(() => {
      expect(mockCreateMemo).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: ['tag1', 'tag2', 'tag3'], // Should be trimmed
        })
      );
    });
  });

  it('shows loading state during submission', async () => {
    const { useMemoStore } = require('../../../stores/memoStore');
    useMemoStore.mockReturnValue({
      createMemo: vi.fn(),
      isLoading: true,
      error: null,
    });

    render(<MemoForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const submitButton = screen.getByRole('button', { name: /creating/i });
    expect(submitButton).toBeDisabled();
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('displays error message on submission failure', async () => {
    const errorMessage = 'Failed to create memo';
    const { useMemoStore } = require('../../../stores/memoStore');
    useMemoStore.mockReturnValue({
      createMemo: vi.fn(),
      isLoading: false,
      error: errorMessage,
    });

    render(<MemoForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<MemoForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('auto-saves draft while typing', async () => {
    const user = userEvent.setup();
    vi.useFakeTimers();
    
    render(<MemoForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'Draft title');

    // Fast-forward time to trigger auto-save
    vi.advanceTimersByTime(2000);

    // Check if draft is saved to localStorage
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'memo-draft',
      expect.stringContaining('Draft title')
    );

    vi.useRealTimers();
  });

  it('loads draft from localStorage on mount', () => {
    const draftData = {
      title: 'Draft Title',
      content: 'Draft content',
      tags: ['draft'],
    };
    
    localStorage.getItem.mockReturnValue(JSON.stringify(draftData));

    render(<MemoForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    expect(screen.getByDisplayValue('Draft Title')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Draft content')).toBeInTheDocument();
    expect(screen.getByDisplayValue('draft')).toBeInTheDocument();
  });

  it('clears draft after successful submission', async () => {
    const user = userEvent.setup();
    const mockCreateMemo = vi.fn().mockResolvedValue({ id: 'new-memo' });
    const { useMemoStore } = require('../../../stores/memoStore');
    useMemoStore.mockReturnValue({
      createMemo: mockCreateMemo,
      isLoading: false,
      error: null,
    });

    render(<MemoForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    // Fill and submit form
    await user.type(screen.getByLabelText(/title/i), 'New Memo');
    await user.type(screen.getByLabelText(/content/i), 'New content');
    await user.click(screen.getByRole('button', { name: /create memo/i }));

    await waitFor(() => {
      expect(localStorage.removeItem).toHaveBeenCalledWith('memo-draft');
    });
  });

  it('has proper accessibility attributes', () => {
    render(<MemoForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const form = screen.getByRole('form');
    expect(form).toHaveAttribute('aria-label', 'Memo form');

    const titleInput = screen.getByLabelText(/title/i);
    expect(titleInput).toHaveAttribute('aria-required', 'true');

    const contentInput = screen.getByLabelText(/content/i);
    expect(contentInput).toHaveAttribute('aria-required', 'true');

    const categorySelect = screen.getByLabelText(/category/i);
    expect(categorySelect).toHaveAttribute('aria-describedby');
  });

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<MemoForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const titleInput = screen.getByLabelText(/title/i);
    const contentInput = screen.getByLabelText(/content/i);
    const categorySelect = screen.getByLabelText(/category/i);
    const tagInput = screen.getByLabelText(/tags/i);

    await user.click(titleInput);
    expect(titleInput).toHaveFocus();

    await user.tab();
    expect(contentInput).toHaveFocus();

    await user.tab();
    expect(categorySelect).toHaveFocus();

    await user.tab();
    expect(tagInput).toHaveFocus();
  });
});