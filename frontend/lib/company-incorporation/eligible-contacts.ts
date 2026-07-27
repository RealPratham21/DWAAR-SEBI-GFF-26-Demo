/** Eligible DRHP issuer contact persons (linked from Management & Governance). */
export type EligibleContactPerson = {
  id: string;
  name: string;
  role: string;
};

/** Returns contact persons eligible for DRHP issuer contact selection. Empty until Management & Governance is implemented. */
export function getEligibleIssuerContactPersons(): EligibleContactPerson[] {
  return [];
}
