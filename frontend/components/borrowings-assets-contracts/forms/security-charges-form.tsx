'use client';

import {
  AssetSelect,
  FacilitySelect,
  FieldGrid,
  PropertySelect,
  SectionCard,
  SelectField,
  SubSection,
  TernaryField,
  TextAreaField,
  TextInputField,
} from '@/components/borrowings-assets-contracts/form-helpers';
import {
  RepeatableCard,
  RepeatableList,
  removeAt,
  replaceAt,
} from '@/components/borrowings-assets-contracts/repeatable-card';
import { BorrowingsAssetsContractsSectionActions } from '@/components/borrowings-assets-contracts/section-actions';
import { DecimalInputField } from '@/components/management-governance/form-helpers';
import { useBorrowingsAssetsContracts } from '@/lib/borrowings-assets-contracts/context';
import {
  createEmptyChargeRecord,
  createEmptyGuaranteeRecord,
  createEmptySecurityRecord,
} from '@/lib/borrowings-assets-contracts/defaults';
import {
  BORROWING_AUTHORITY_STATE_OPTIONS,
  CHARGE_RANKING_OPTIONS,
  CHARGE_STATUS_OPTIONS,
  GUARANTEE_TYPE_OPTIONS,
  SECURED_OBJECT_OPTIONS,
  SECURITY_TYPE_OPTIONS,
} from '@/lib/borrowings-assets-contracts/options';
import type {
  BorrowingAuthorityState,
  BorrowingPowers,
  ChargeRanking,
  ChargeRecord,
  ChargeStatus,
  GuaranteeRecord,
  GuaranteeType,
  SecuredObject,
  SecurityChargesGuaranteesAndBorrowingPowers,
  SecurityRecord,
  SecurityType,
} from '@/lib/schemas/borrowings-assets-contracts';

const SECTION_ID = 'security-charges-guarantees-and-borrowing-powers' as const;

export function SecurityChargesForm() {
  const { payload, updateSection } = useBorrowingsAssetsContracts();
  const value = payload.securityChargesGuaranteesAndBorrowingPowers;

  const set = <K extends keyof SecurityChargesGuaranteesAndBorrowingPowers>(
    key: K,
    next: SecurityChargesGuaranteesAndBorrowingPowers[K],
  ) => {
    updateSection('securityChargesGuaranteesAndBorrowingPowers', { ...value, [key]: next }, SECTION_ID);
  };

  const setBorrowingPowers = <K extends keyof BorrowingPowers>(
    key: K,
    next: BorrowingPowers[K],
  ) => {
    set('borrowingPowers', { ...value.borrowingPowers, [key]: next });
  };

  const setSecurities = (next: SecurityRecord[]) => set('securities', next);
  const setCharges = (next: ChargeRecord[]) => set('charges', next);
  const setGuarantees = (next: GuaranteeRecord[]) => set('guarantees', next);

  return (
    <SectionCard
      title="Security, Charges, Guarantees & Borrowing Powers"
      description="Security/collateral register, RoC charges, guarantees and borrowing authority."
    >
      <RepeatableList
        title="Securities & collateral"
        addLabel="Add security"
        onAdd={() => setSecurities([...value.securities, createEmptySecurityRecord()])}
        emptyMessage="No securities recorded yet."
        count={value.securities.length}
      >
        {value.securities.map((security, index) => (
          <RepeatableCard
            key={security.id}
            title={security.securityType.replaceAll('-', ' ') || `Security ${index + 1}`}
            onRemove={() => setSecurities(removeAt(value.securities, index))}
          >
            <FieldGrid columns={3}>
              <FacilitySelect
                id={`sec-${security.id}-facility`}
                label="Linked facility"
                value={security.linkedFacilityId}
                onChange={(next) =>
                  setSecurities(
                    replaceAt(value.securities, index, { ...security, linkedFacilityId: next }),
                  )
                }
                payload={payload}
              />
              <SelectField
                id={`sec-${security.id}-type`}
                label="Security type"
                value={security.securityType}
                onChange={(next) =>
                  setSecurities(
                    replaceAt(value.securities, index, {
                      ...security,
                      securityType: next as SecurityType | '',
                    }),
                  )
                }
                options={[{ value: '', label: 'Select…' }, ...SECURITY_TYPE_OPTIONS]}
              />
              <SelectField
                id={`sec-${security.id}-object`}
                label="Secured object"
                value={security.securedObject}
                onChange={(next) =>
                  setSecurities(
                    replaceAt(value.securities, index, {
                      ...security,
                      securedObject: next as SecuredObject | '',
                    }),
                  )
                }
                options={[{ value: '', label: 'Select…' }, ...SECURED_OBJECT_OPTIONS]}
              />
              <PropertySelect
                id={`sec-${security.id}-property`}
                label="Linked property"
                value={security.linkedPropertyId}
                onChange={(next) =>
                  setSecurities(
                    replaceAt(value.securities, index, { ...security, linkedPropertyId: next }),
                  )
                }
                payload={payload}
              />
              <AssetSelect
                id={`sec-${security.id}-asset`}
                label="Linked asset"
                value={security.linkedAssetId}
                onChange={(next) =>
                  setSecurities(
                    replaceAt(value.securities, index, { ...security, linkedAssetId: next }),
                  )
                }
                payload={payload}
              />
              <SelectField
                id={`sec-${security.id}-ranking`}
                label="Charge ranking"
                value={security.chargeRanking}
                onChange={(next) =>
                  setSecurities(
                    replaceAt(value.securities, index, {
                      ...security,
                      chargeRanking: next as ChargeRanking | '',
                    }),
                  )
                }
                options={[{ value: '', label: 'Select…' }, ...CHARGE_RANKING_OPTIONS]}
              />
              <DecimalInputField
                id={`sec-${security.id}-amount`}
                label="Amount secured"
                value={security.amountSecured}
                onChange={(next) =>
                  setSecurities(
                    replaceAt(value.securities, index, { ...security, amountSecured: next }),
                  )
                }
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="RoC charges"
        addLabel="Add charge"
        onAdd={() => setCharges([...value.charges, createEmptyChargeRecord()])}
        emptyMessage="No charges recorded yet."
        count={value.charges.length}
      >
        {value.charges.map((charge, index) => (
          <RepeatableCard
            key={charge.id}
            title={charge.chargeIdentifier || charge.srn || `Charge ${index + 1}`}
            onRemove={() => setCharges(removeAt(value.charges, index))}
          >
            <FieldGrid columns={3}>
              <FacilitySelect
                id={`ch-${charge.id}-facility`}
                label="Linked facility"
                value={charge.linkedFacilityId}
                onChange={(next) =>
                  setCharges(replaceAt(value.charges, index, { ...charge, linkedFacilityId: next }))
                }
                payload={payload}
              />
              <TextInputField
                id={`ch-${charge.id}-identifier`}
                label="Charge identifier"
                value={charge.chargeIdentifier}
                onChange={(next) =>
                  setCharges(replaceAt(value.charges, index, { ...charge, chargeIdentifier: next }))
                }
              />
              <SelectField
                id={`ch-${charge.id}-status`}
                label="Status"
                value={charge.status}
                onChange={(next) =>
                  setCharges(
                    replaceAt(value.charges, index, {
                      ...charge,
                      status: next as ChargeStatus | '',
                    }),
                  )
                }
                options={[{ value: '', label: 'Select…' }, ...CHARGE_STATUS_OPTIONS]}
              />
              <TextInputField
                id={`ch-${charge.id}-srn`}
                label="SRN"
                value={charge.srn}
                onChange={(next) =>
                  setCharges(replaceAt(value.charges, index, { ...charge, srn: next }))
                }
              />
              <TernaryField
                id={`ch-${charge.id}-mod-pending`}
                label="Modification pending"
                value={charge.modificationPending}
                onChange={(next) =>
                  setCharges(replaceAt(value.charges, index, { ...charge, modificationPending: next }))
                }
              />
              <TernaryField
                id={`ch-${charge.id}-sat-pending`}
                label="Satisfaction pending"
                value={charge.satisfactionPending}
                onChange={(next) =>
                  setCharges(replaceAt(value.charges, index, { ...charge, satisfactionPending: next }))
                }
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Guarantees"
        addLabel="Add guarantee"
        onAdd={() => setGuarantees([...value.guarantees, createEmptyGuaranteeRecord()])}
        emptyMessage="No guarantees recorded yet."
        count={value.guarantees.length}
      >
        {value.guarantees.map((guarantee, index) => (
          <RepeatableCard
            key={guarantee.id}
            title={guarantee.guaranteeType.replaceAll('-', ' ') || `Guarantee ${index + 1}`}
            onRemove={() => setGuarantees(removeAt(value.guarantees, index))}
          >
            <FieldGrid columns={3}>
              <SelectField
                id={`gu-${guarantee.id}-type`}
                label="Guarantee type"
                value={guarantee.guaranteeType}
                onChange={(next) =>
                  setGuarantees(
                    replaceAt(value.guarantees, index, {
                      ...guarantee,
                      guaranteeType: next as GuaranteeType | '',
                    }),
                  )
                }
                options={[{ value: '', label: 'Select…' }, ...GUARANTEE_TYPE_OPTIONS]}
              />
              <TextInputField
                id={`gu-${guarantee.id}-guarantor`}
                label="Guarantor"
                value={guarantee.guarantor}
                onChange={(next) =>
                  setGuarantees(replaceAt(value.guarantees, index, { ...guarantee, guarantor: next }))
                }
              />
              <FacilitySelect
                id={`gu-${guarantee.id}-facility`}
                label="Linked facility"
                value={guarantee.linkedFacilityId}
                onChange={(next) =>
                  setGuarantees(
                    replaceAt(value.guarantees, index, { ...guarantee, linkedFacilityId: next }),
                  )
                }
                payload={payload}
              />
              <DecimalInputField
                id={`gu-${guarantee.id}-amount`}
                label="Guarantee amount / cap"
                value={guarantee.guaranteeAmountCap}
                onChange={(next) =>
                  setGuarantees(
                    replaceAt(value.guarantees, index, { ...guarantee, guaranteeAmountCap: next }),
                  )
                }
              />
              <TernaryField
                id={`gu-${guarantee.id}-ipo-release`}
                label="IPO/listing release proposed"
                value={guarantee.ipoListingReleaseProposed}
                onChange={(next) =>
                  setGuarantees(
                    replaceAt(value.guarantees, index, { ...guarantee, ipoListingReleaseProposed: next }),
                  )
                }
              />
              <TernaryField
                id={`gu-${guarantee.id}-lender-consent`}
                label="Lender consent required"
                value={guarantee.lenderConsentRequired}
                onChange={(next) =>
                  setGuarantees(
                    replaceAt(value.guarantees, index, { ...guarantee, lenderConsentRequired: next }),
                  )
                }
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <SubSection title="Borrowing powers">
        <FieldGrid columns={3}>
          <TernaryField
            id="bac-board-resolution"
            label="Board borrowing resolution exists"
            value={value.borrowingPowers.boardBorrowingResolutionExists}
            onChange={(next) => setBorrowingPowers('boardBorrowingResolutionExists', next)}
          />
          <DecimalInputField
            id="bac-approved-limit"
            label="Approved borrowing limit"
            value={value.borrowingPowers.approvedBorrowingLimit}
            onChange={(next) => setBorrowingPowers('approvedBorrowingLimit', next)}
          />
          <TernaryField
            id="bac-shareholder-approval"
            label="Shareholder borrowing approval exists"
            value={value.borrowingPowers.shareholderBorrowingApprovalExists}
            onChange={(next) => setBorrowingPowers('shareholderBorrowingApprovalExists', next)}
          />
          <SelectField
            id="bac-authority-state"
            label="Authority state"
            value={value.borrowingPowers.authorityState}
            onChange={(next) =>
              setBorrowingPowers('authorityState', next as BorrowingAuthorityState | '')
            }
            options={[{ value: '', label: 'Select…' }, ...BORROWING_AUTHORITY_STATE_OPTIONS]}
          />
        </FieldGrid>
        <TextAreaField
          id="bac-borrowing-powers-notes"
          label="Notes"
          value={value.borrowingPowers.notes}
          onChange={(next) => setBorrowingPowers('notes', next)}
        />
      </SubSection>

      <BorrowingsAssetsContractsSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
