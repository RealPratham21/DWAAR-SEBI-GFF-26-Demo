import { describe, expect, it } from 'vitest';
import {
  formatDate,
  formatDrhpValue,
  formatFinancialPeriod,
  formatIndianInteger,
  formatInrAmount,
  formatTableCell,
  inferSemanticTypeFromHeader,
} from '@/lib/drhp/publication/formatters';

describe('DRHP P1.1 semantic formatters', () => {
  it('preserves telephone numbers', () => {
    expect(formatTableCell('2045678901', 'telephone')).toBe('2045678901');
  });

  it('preserves DIN leading zeroes', () => {
    expect(formatTableCell('01234567', 'din')).toBe('01234567');
  });

  it('groups share counts when semantic type is set', () => {
    expect(formatTableCell('45000000', 'share_count')).toBe('4,50,00,000');
  });

  it('does not auto-group bare numeric strings', () => {
    expect(formatDrhpValue('01234567')).toBe('01234567');
    expect(formatDrhpValue('45000000')).toBe('45000000');
  });

  it('formats financial periods', () => {
    expect(formatFinancialPeriod('nivara-fy2024')).toBe('FY 2024');
  });

  it('renders material contract party names only', () => {
    const formatted = formatDrhpValue({
      role: 'customer',
      counterparty: 'AutoDrive Components India Private Limited',
    });
    expect(formatted).toBe('AutoDrive Components India Private Limited');
    expect(formatted.includes('{')).toBe(false);
  });

  it('formats INR with rupee symbol', () => {
    expect(formatInrAmount(58000000)).toBe('₹5,80,00,000');
  });

  it('infers column semantics from headers', () => {
    expect(inferSemanticTypeFromHeader('DIN')).toBe('din');
    expect(inferSemanticTypeFromHeader('Number of shares')).toBe('share_count');
  });
});
