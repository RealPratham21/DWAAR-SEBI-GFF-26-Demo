import type { RegisteredOffice } from '@/lib/workspace/types';

export function isPresent(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

export function companyMonogram(legalName: string): string {
  const words = legalName
    .replace(/\b(private|limited|ltd|pvt|company|co\.?)\b/gi, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) {
    return legalName.slice(0, 2).toUpperCase() || '—';
  }
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
}

export function formatRegisteredOfficeLines(office: RegisteredOffice): string[] {
  const street = [office.addressLine1, office.addressLine2].filter(isPresent).join(', ');
  const localityLine = [office.locality, office.city, office.district].filter(isPresent).join(', ');
  const statePin = [office.state, office.pinCode].filter(isPresent).join(' — ');
  const lines = [street, localityLine, statePin, office.country].filter(isPresent);
  return lines;
}

export function normalizeWebsiteHref(website: string): string {
  const trimmed = website.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function displayWebsiteLabel(website: string): string {
  return website.trim().replace(/^https?:\/\//i, '').replace(/\/$/, '');
}
