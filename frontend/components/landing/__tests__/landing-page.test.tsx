import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LandingPage } from '@/components/landing/landing-page';

vi.mock('@/lib/auth/context', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    isRestoringSession: false,
    nextAction: null,
    redirectTo: null,
    logout: vi.fn(),
  }),
}));

describe('LandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders core positioning and sections', () => {
    render(<LandingPage />);

    expect(
      screen.getByRole('heading', {
        name: /from company information to a review-ready drhp/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/The first mile of an SME IPO is still painfully manual/i)).toBeInTheDocument();
    expect(screen.getByText(/Try the complete flow with Nivara/i)).toBeInTheDocument();
    expect(screen.getByText('nivara.demo@example.com')).toBeInTheDocument();
    expect(screen.getByText('How Dwaar works')).toBeInTheDocument();
  });

  it('does not show stale unsupported claims', () => {
    render(<LandingPage />);

    expect(screen.queryByText(/Compliance Ready/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/merchant banker comments/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/SEBI compliant/i)).not.toBeInTheDocument();
  });

  it('includes hackathon attribution', () => {
    render(<LandingPage />);

    expect(screen.getByText(/Team Stay24/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Prathamesh Bhamare/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/SEBI Securities Market TechSprint @ GFF 2026/i).length).toBeGreaterThanOrEqual(1);
  });
});
