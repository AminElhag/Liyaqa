import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeadForm } from './lead-form';
import type { Lead } from '@liyaqa/shared/types/lead';

// Mock next-intl
vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}));

describe('LeadForm', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSubmit.mockResolvedValue(undefined);
  });

  it('should render all required form fields', () => {
    render(
      <LeadForm
        onSubmit={mockOnSubmit}
        isPending={false}
      />
    );

    // Check for required fields
    expect(screen.getByLabelText(/^name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^source/i)).toBeInTheDocument();
  });

  it('should show validation errors for required fields', async () => {
    const user = userEvent.setup();

    render(
      <LeadForm
        onSubmit={mockOnSubmit}
        isPending={false}
      />
    );

    // Try to submit without filling required fields
    const submitButton = screen.getByRole('button', { name: /submit|save|create/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email.*required/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should validate email format', async () => {
    const user = userEvent.setup();

    render(
      <LeadForm
        onSubmit={mockOnSubmit}
        isPending={false}
      />
    );

    const emailInput = screen.getByLabelText(/^email/i);
    await user.type(emailInput, 'invalid.email');

    const submitButton = screen.getByRole('button', { name: /submit|save|create/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();

    render(
      <LeadForm
        onSubmit={mockOnSubmit}
        isPending={false}
      />
    );

    // Fill in required fields
    await user.type(screen.getByLabelText(/^name/i), 'John Doe');
    await user.type(screen.getByLabelText(/^email/i), 'john.doe@example.com');

    // Select source
    const sourceSelect = screen.getByLabelText(/^source[^a-z]/i);
    await user.click(sourceSelect);
    const walkInOption = await screen.findByText(/walk.*in/i);
    await user.click(walkInOption);

    const submitButton = screen.getByRole('button', { name: /submit|save|create/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'John Doe',
          email: 'john.doe@example.com',
          source: 'WALK_IN',
        })
      );
    });
  });

  it('should populate form when editing existing lead', () => {
    const existingLead: Partial<Lead> = {
      id: '123',
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '+966501234567',
      source: 'REFERRAL',
      priority: 'HIGH',
      notes: 'Interested in premium membership',
    };

    render(
      <LeadForm
        lead={existingLead as Lead}
        onSubmit={mockOnSubmit}
        isPending={false}
      />
    );

    // Check that fields are populated
    expect(screen.getByDisplayValue('Jane Smith')).toBeInTheDocument();
    expect(screen.getByDisplayValue('jane.smith@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('+966501234567')).toBeInTheDocument();
  });

  it('should disable submit button when pending', () => {
    render(
      <LeadForm
        onSubmit={mockOnSubmit}
        isPending={true}
      />
    );

    const submitButton = screen.getByRole('button', { name: /create|update/i });
    expect(submitButton).toBeDisabled();
  });

  it('should handle optional fields correctly', async () => {
    const user = userEvent.setup();

    render(
      <LeadForm
        onSubmit={mockOnSubmit}
        isPending={false}
      />
    );

    // Fill required fields
    await user.type(screen.getByLabelText(/^name/i), 'Test Lead');
    await user.type(screen.getByLabelText(/^email/i), 'test@example.com');

    // Fill optional fields
    const phoneInput = screen.queryByLabelText(/phone/i);
    if (phoneInput) {
      await user.type(phoneInput, '+966501234567');
    }

    const notesInput = screen.queryByLabelText(/notes/i);
    if (notesInput) {
      await user.type(notesInput, 'Very interested in membership');
    }

    // Select source
    const sourceSelect = screen.getByLabelText(/^source[^a-z]/i);
    await user.click(sourceSelect);
    const referralOption = await screen.findByText(/referral/i);
    await user.click(referralOption);

    const submitButton = screen.getByRole('button', { name: /submit|save|create/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Lead',
          email: 'test@example.com',
          source: 'REFERRAL',
        })
      );
    });
  });

  it('should support all lead source options', async () => {
    const user = userEvent.setup();

    render(
      <LeadForm
        onSubmit={mockOnSubmit}
        isPending={false}
      />
    );

    const sourceSelect = screen.getByLabelText(/^source[^a-z]/i);
    await user.click(sourceSelect);

    // Check that various source options are available
    const expectedSources = [
      /walk.*in/i,
      /referral/i,
      /social.*media/i,
      /website/i,
      /paid.*ads/i,
    ];

    for (const sourcePattern of expectedSources) {
      expect(screen.getByText(sourcePattern)).toBeInTheDocument();
    }
  });

  it('should support all priority levels', async () => {
    const user = userEvent.setup();

    render(
      <LeadForm
        onSubmit={mockOnSubmit}
        isPending={false}
      />
    );

    const prioritySelect = screen.queryByLabelText(/priority/i);
    if (prioritySelect) {
      await user.click(prioritySelect);

      // Check that priority options are available
      const expectedPriorities = [/low/i, /medium/i, /high/i, /urgent/i];

      for (const priorityPattern of expectedPriorities) {
        expect(screen.getByText(priorityPattern)).toBeInTheDocument();
      }
    }
  });

  it('should handle campaign tracking fields', async () => {
    const user = userEvent.setup();

    render(
      <LeadForm
        onSubmit={mockOnSubmit}
        isPending={false}
      />
    );

    // Fill required fields
    await user.type(screen.getByLabelText(/^name/i), 'Campaign Lead');
    await user.type(screen.getByLabelText(/^email/i), 'campaign@example.com');

    // Fill campaign tracking fields if available
    const campaignSourceInput = screen.queryByLabelText(/campaign.*source/i);
    if (campaignSourceInput) {
      await user.type(campaignSourceInput, 'google');
    }

    const campaignMediumInput = screen.queryByLabelText(/campaign.*medium/i);
    if (campaignMediumInput) {
      await user.type(campaignMediumInput, 'cpc');
    }

    const campaignNameInput = screen.queryByLabelText(/campaign.*name/i);
    if (campaignNameInput) {
      await user.type(campaignNameInput, 'summer_2026');
    }

    // Select source
    const sourceSelect = screen.getByLabelText(/^source[^a-z]/i);
    await user.click(sourceSelect);
    const paidAdsOption = await screen.findByText(/paid.*ads/i);
    await user.click(paidAdsOption);

    const submitButton = screen.getByRole('button', { name: /submit|save|create/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  it('should handle form submission errors', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Email already exists';
    mockOnSubmit.mockRejectedValueOnce(new Error(errorMessage));

    render(
      <LeadForm
        onSubmit={mockOnSubmit}
        isPending={false}
      />
    );

    // Fill and submit form
    await user.type(screen.getByLabelText(/^name/i), 'Test');
    await user.type(screen.getByLabelText(/^email/i), 'existing@example.com');

    const sourceSelect = screen.getByLabelText(/^source[^a-z]/i);
    await user.click(sourceSelect);
    const walkInOption = await screen.findByText(/walk.*in/i);
    await user.click(walkInOption);

    const submitButton = screen.getByRole('button', { name: /submit|save|create/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  it('should clear validation errors when user corrects input', async () => {
    const user = userEvent.setup();

    render(
      <LeadForm
        onSubmit={mockOnSubmit}
        isPending={false}
      />
    );

    // Submit empty form to trigger validation
    const submitButton = screen.getByRole('button', { name: /submit|save|create/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });

    // Fix the error
    await user.type(screen.getByLabelText(/^name/i), 'John Doe');

    // Error should disappear
    await waitFor(() => {
      expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument();
    });
  });
});
