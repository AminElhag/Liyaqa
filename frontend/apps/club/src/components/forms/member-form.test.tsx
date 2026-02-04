import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemberForm } from './member-form';
import type { Member } from '@liyaqa/shared/types/member';

// Mock next-intl
vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}));

describe('MemberForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all form fields', () => {
    render(
      <MemberForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Check for essential fields (bilingual form has two fields for each name)
    expect(screen.getByLabelText(/first name.*english/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/first name.*arabic/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name.*english/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name.*arabic/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^phone number/i)).toBeInTheDocument();
  });

  it('should show validation errors when submitting empty form', async () => {
    const user = userEvent.setup();

    render(
      <MemberForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const submitButton = screen.getByRole('button', { name: /save|submit|create/i });
    await user.click(submitButton);

    // Should show validation errors (form should not submit empty)
    await waitFor(() => {
      // At minimum, should show error for required name fields
      const errorElements = screen.queryAllByText(/required/i);
      expect(errorElements.length).toBeGreaterThan(0);
    });

    // Should not call onSubmit
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should validate email format', async () => {
    const user = userEvent.setup();

    render(
      <MemberForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const emailInput = screen.getByLabelText(/^email/i);
    await user.type(emailInput, 'invalid-email');

    const submitButton = screen.getByRole('button', { name: /save|submit|create/i });
    await user.click(submitButton);

    // Form should not submit with invalid email (either shows error or prevents submission)
    await waitFor(() => {
      const errorElement = screen.queryByText(/invalid.*email|valid email|email.*invalid/i);
      // Either there's an error message OR the form didn't submit
      expect(errorElement || !mockOnSubmit.mock.calls.length).toBeTruthy();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();

    render(
      <MemberForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Fill in required fields
    await user.type(screen.getByLabelText(/first name.*english/i), 'John');
    await user.type(screen.getByLabelText(/last name.*english/i), 'Doe');
    await user.type(screen.getByLabelText(/^email/i), 'john.doe@example.com');
    await user.type(screen.getByLabelText(/^phone number/i), '+966501234567');

    const submitButton = screen.getByRole('button', { name: /save|submit|create/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
      const callArgs = mockOnSubmit.mock.calls[0][0];
      expect(callArgs.firstName.en).toBe('John');
      expect(callArgs.lastName.en).toBe('Doe');
      expect(callArgs.email).toBe('john.doe@example.com');
      expect(callArgs.phone).toBe('+966501234567');
    });
  });

  it('should populate form when editing existing member', () => {
    const existingMember: Partial<Member> = {
      id: '123',
      firstName: { en: 'Jane', ar: 'جين' },
      lastName: { en: 'Smith', ar: 'سميث' },
      email: 'jane.smith@example.com',
      phone: '+966509876543',
      gender: 'FEMALE',
    };

    render(
      <MemberForm
        member={existingMember as Member}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Check that fields are populated
    expect(screen.getByDisplayValue('Jane')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Smith')).toBeInTheDocument();
    expect(screen.getByDisplayValue('jane.smith@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('+966509876543')).toBeInTheDocument();
  });

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <MemberForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should disable submit button when submitting', () => {
    render(
      <MemberForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={true}
      />
    );

    const submitButton = screen.getByRole('button', { name: /save|submit|create|saving|submitting/i });
    expect(submitButton).toBeDisabled();
  });

  it('should accept bilingual input (English and Arabic)', async () => {
    const user = userEvent.setup();

    render(
      <MemberForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Fill in English fields
    await user.type(screen.getByLabelText(/first name.*english/i), 'Mohammed');
    await user.type(screen.getByLabelText(/last name.*english/i), 'Ahmed');

    // Fill in Arabic fields if available
    const arabicFirstName = screen.queryByLabelText(/first name.*arabic/i);
    if (arabicFirstName) {
      await user.type(arabicFirstName, 'محمد');
    }

    const arabicLastName = screen.queryByLabelText(/last name.*arabic/i);
    if (arabicLastName) {
      await user.type(arabicLastName, 'أحمد');
    }

    await user.type(screen.getByLabelText(/^email/i), 'mohammed@example.com');
    await user.type(screen.getByLabelText(/^phone number/i), '+966501234567');

    const submitButton = screen.getByRole('button', { name: /save|submit|create/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  it('should handle optional fields correctly', async () => {
    const user = userEvent.setup();

    render(
      <MemberForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Fill required fields only
    await user.type(screen.getByLabelText(/first name.*english/i), 'John');
    await user.type(screen.getByLabelText(/last name.*english/i), 'Doe');
    await user.type(screen.getByLabelText(/^email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/^phone number/i), '+966501234567');

    // Optional fields
    const emergencyContactName = screen.queryByLabelText(/emergency contact name/i);
    if (emergencyContactName) {
      await user.type(emergencyContactName, 'Jane Doe');
    }

    const emergencyContactPhone = screen.queryByLabelText(/emergency contact phone/i);
    if (emergencyContactPhone) {
      await user.type(emergencyContactPhone, '+966507654321');
    }

    const submitButton = screen.getByRole('button', { name: /save|submit|create/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
      const callArgs = mockOnSubmit.mock.calls[0][0];
      expect(callArgs.email).toBe('john@example.com');
      expect(callArgs.phone).toBe('+966501234567');
    });
  });

  it('should validate phone number is required', async () => {
    const user = userEvent.setup();

    render(
      <MemberForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Fill all fields except phone
    await user.type(screen.getByLabelText(/first name.*english/i), 'John');
    await user.type(screen.getByLabelText(/last name.*english/i), 'Doe');
    await user.type(screen.getByLabelText(/^email/i), 'john@example.com');

    const submitButton = screen.getByRole('button', { name: /save|submit|create/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/phone.*required/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});
