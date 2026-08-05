/**
 * IPO Setup & Eligibility — public frontend barrel.
 * Persist `IpoSetupPayload` via `/workstreams/ipo-setup-eligibility` APIs (I2).
 */

export { IPO_SETUP_SCHEMA_VERSION, ipoSetupPayloadSchema } from '@/lib/schemas/ipo-setup';
export { createEmptyIpoSetupPayload } from '@/lib/ipo-setup/defaults';
export { calculateIpoSetupProgress } from '@/lib/ipo-setup/progress';
export { computeOfferFromPayload, computeOfferStructure } from '@/lib/ipo-setup/offer-compute';
export {
  IPO_SETUP_TABS,
  IPO_SETUP_INFORMATION_SECTIONS,
} from '@/lib/ipo-setup/options';
