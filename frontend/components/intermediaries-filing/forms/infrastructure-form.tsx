'use client';

import {
  asEnumValue,
  FieldGrid,
  IntermediarySelect,
  SectionCard,
  SelectField,
  SubSection,
  TernaryField,
  TextAreaField,
  TextInputField,
} from '@/components/intermediaries-filing/form-helpers';
import {
  RepeatableCard,
  RepeatableList,
  removeAt,
  replaceAt,
} from '@/components/intermediaries-filing/repeatable-card';
import { IntermediariesFilingSectionActions } from '@/components/intermediaries-filing/section-actions';
import { useIntermediariesFiling } from '@/lib/intermediaries-filing/context';
import {
  createEmptyIssueBankRoleRecord,
} from '@/lib/intermediaries-filing/defaults';
import {
  ACCOUNT_SETUP_STATUS_OPTIONS,
  ISIN_STATUS_OPTIONS,
  ISSUE_BANK_ROLE_OPTIONS,
  PROFESSIONAL_CONFIRMATION_OPTIONS,
} from '@/lib/intermediaries-filing/options';
import type {
  AccountSetupStatus,
  DepositoriesBankingAsbaUpiAndIssueInfrastructure,
  DepositoryAgreement,
  IsinStatus,
  IssueBankRole,
  ProfessionalConfirmationStatus,
} from '@/lib/schemas/intermediaries-filing';

const SECTION_ID = 'depositories-banking-asba-upi-and-issue-infrastructure' as const;

export function InfrastructureForm() {
  const { payload, updateSection } = useIntermediariesFiling();
  const value = payload.depositoriesBankingAsbaUpiAndIssueInfrastructure;

  const set = (next: DepositoriesBankingAsbaUpiAndIssueInfrastructure) => {
    updateSection('depositoriesBankingAsbaUpiAndIssueInfrastructure', next, SECTION_ID);
  };

  const setDepositoryReadiness = (
    patch: Partial<DepositoriesBankingAsbaUpiAndIssueInfrastructure['depositoryReadiness']>,
  ) => set({ ...value, depositoryReadiness: { ...value.depositoryReadiness, ...patch } });

  const setDepositoryAgreement = (side: 'nsdl' | 'cdsl', patch: Partial<DepositoryAgreement>) => {
    set({
      ...value,
      depositoryAgreements: {
        ...value.depositoryAgreements,
        [side]: { ...value.depositoryAgreements[side], ...patch },
      },
    });
  };

  const setBankRoles = (
    issueBankRoles: DepositoriesBankingAsbaUpiAndIssueInfrastructure['issueBankRoles'],
  ) => set({ ...value, issueBankRoles });

  const setBankRole = (
    index: number,
    next: DepositoriesBankingAsbaUpiAndIssueInfrastructure['issueBankRoles'][number],
  ) => setBankRoles(replaceAt(value.issueBankRoles, index, next));

  const setSponsorBank = (
    patch: Partial<DepositoriesBankingAsbaUpiAndIssueInfrastructure['sponsorBankUpiReadiness']>,
  ) => set({ ...value, sponsorBankUpiReadiness: { ...value.sponsorBankUpiReadiness, ...patch } });

  const setAsba = (patch: Partial<DepositoriesBankingAsbaUpiAndIssueInfrastructure['asbaConfiguration']>) =>
    set({ ...value, asbaConfiguration: { ...value.asbaConfiguration, ...patch } });

  return (
    <SectionCard
      title="Depositories, Banking, ASBA/UPI & Issue Infrastructure"
      description="ISIN/depository readiness, issue bank roles, Sponsor Bank/UPI and ASBA configuration."
    >
      <SubSection title="Depository readiness">
        <FieldGrid columns={3}>
          <TextInputField
            id="isin"
            label="ISIN"
            value={value.depositoryReadiness.isin}
            onChange={(next) => setDepositoryReadiness({ isin: next })}
          />
          <SelectField
            id="isin-status"
            label="ISIN status"
            value={value.depositoryReadiness.isinStatus}
            onChange={(next) =>
              setDepositoryReadiness({ isinStatus: asEnumValue<IsinStatus>(next) })
            }
            options={[{ value: '', label: 'Select…' }, ...ISIN_STATUS_OPTIONS]}
          />
          <TernaryField
            id="new-temporary-isin"
            label="New / temporary ISIN requirement"
            value={value.depositoryReadiness.newTemporaryIsinRequirement}
            onChange={(next) => setDepositoryReadiness({ newTemporaryIsinRequirement: next })}
          />
          <TextInputField
            id="nsdl-connectivity"
            label="NSDL connectivity status"
            value={value.depositoryReadiness.nsdlConnectivityStatus}
            onChange={(next) => setDepositoryReadiness({ nsdlConnectivityStatus: next })}
          />
          <TextInputField
            id="cdsl-connectivity"
            label="CDSL connectivity status"
            value={value.depositoryReadiness.cdslConnectivityStatus}
            onChange={(next) => setDepositoryReadiness({ cdslConnectivityStatus: next })}
          />
          <SelectField
            id="depository-professional-confirmation"
            label="Professional confirmation"
            value={value.depositoryReadiness.professionalConfirmation}
            onChange={(next) =>
              setDepositoryReadiness({
                professionalConfirmation: asEnumValue<ProfessionalConfirmationStatus>(next),
              })
            }
            options={[{ value: '', label: 'Select…' }, ...PROFESSIONAL_CONFIRMATION_OPTIONS]}
          />
        </FieldGrid>
      </SubSection>

      <div className="grid gap-4 lg:grid-cols-2">
        {(['nsdl', 'cdsl'] as const).map((side) => (
          <SubSection key={side} title={`${side.toUpperCase()} tripartite agreement`}>
            <FieldGrid>
              <TernaryField
                id={`${side}-agreement-exists`}
                label="Agreement exists"
                value={value.depositoryAgreements[side].agreementExists}
                onChange={(next) => setDepositoryAgreement(side, { agreementExists: next })}
              />
              <TextInputField
                id={`${side}-agreement-date`}
                label="Agreement date"
                type="date"
                value={value.depositoryAgreements[side].agreementDate}
                onChange={(next) => setDepositoryAgreement(side, { agreementDate: next })}
              />
              <IntermediarySelect
                id={`${side}-registrar`}
                label="Registrar intermediary"
                value={value.depositoryAgreements[side].registrarIntermediaryId}
                onChange={(next) =>
                  setDepositoryAgreement(side, { registrarIntermediaryId: next })
                }
                payload={payload}
              />
            </FieldGrid>
          </SubSection>
        ))}
      </div>

      <RepeatableList
        title="Issue bank roles"
        addLabel="Add bank role"
        onAdd={() => setBankRoles([...value.issueBankRoles, createEmptyIssueBankRoleRecord()])}
        emptyMessage="No issue bank roles recorded."
        count={value.issueBankRoles.length}
      >
        {value.issueBankRoles.map((role, index) => (
          <RepeatableCard
            key={role.bankRoleId}
            title={`Bank role ${index + 1}`}
            onRemove={() => setBankRoles(removeAt(value.issueBankRoles, index))}
            removeLabel="Remove bank role"
          >
            <FieldGrid columns={3}>
              <IntermediarySelect
                id={`bank-intermediary-${index}`}
                label="Intermediary"
                value={role.intermediaryId}
                onChange={(next) => setBankRole(index, { ...role, intermediaryId: next })}
                payload={payload}
              />
              <SelectField
                id={`bank-role-${index}`}
                label="Role"
                value={role.role}
                onChange={(next) =>
                  setBankRole(index, { ...role, role: asEnumValue<IssueBankRole>(next) })
                }
                options={[{ value: '', label: 'Select…' }, ...ISSUE_BANK_ROLE_OPTIONS]}
              />
              <SelectField
                id={`account-setup-${index}`}
                label="Account setup status"
                value={role.accountSetupStatus}
                onChange={(next) =>
                  setBankRole(index, {
                    ...role,
                    accountSetupStatus: asEnumValue<AccountSetupStatus>(next),
                  })
                }
                options={[{ value: '', label: 'Select…' }, ...ACCOUNT_SETUP_STATUS_OPTIONS]}
              />
              <TernaryField
                id={`testing-completed-${index}`}
                label="Testing completed"
                value={role.testingCompleted}
                onChange={(next) => setBankRole(index, { ...role, testingCompleted: next })}
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <SubSection title="Sponsor Bank & UPI readiness">
        <FieldGrid columns={3}>
          <TernaryField
            id="sponsor-bank-appointed"
            label="Sponsor Bank appointed"
            value={value.sponsorBankUpiReadiness.sponsorBankAppointed}
            onChange={(next) => setSponsorBank({ sponsorBankAppointed: next })}
          />
          <IntermediarySelect
            id="sponsor-bank-intermediary"
            label="Sponsor Bank intermediary"
            value={value.sponsorBankUpiReadiness.intermediaryId}
            onChange={(next) => setSponsorBank({ intermediaryId: next })}
            payload={payload}
          />
          <TernaryField
            id="upi-setup-complete"
            label="UPI setup complete"
            value={value.sponsorBankUpiReadiness.upiSetupComplete}
            onChange={(next) => setSponsorBank({ upiSetupComplete: next })}
          />
          <TernaryField
            id="npci-readiness"
            label="NPCI readiness confirmed"
            value={value.sponsorBankUpiReadiness.npciReadinessConfirmed}
            onChange={(next) => setSponsorBank({ npciReadinessConfirmed: next })}
          />
          <TernaryField
            id="sponsor-test-completed"
            label="Test completed"
            value={value.sponsorBankUpiReadiness.testCompleted}
            onChange={(next) => setSponsorBank({ testCompleted: next })}
          />
        </FieldGrid>
        <TextAreaField
          id="contingency-process"
          label="Contingency process"
          value={value.sponsorBankUpiReadiness.contingencyProcess}
          onChange={(next) => setSponsorBank({ contingencyProcess: next })}
        />
      </SubSection>

      <SubSection title="ASBA configuration">
        <FieldGrid columns={3}>
          <TernaryField
            id="asba-applicable"
            label="ASBA applicable"
            value={value.asbaConfiguration.asbaApplicable}
            onChange={(next) => setAsba({ asbaApplicable: next })}
          />
          <TernaryField
            id="upi-mechanism-applicable"
            label="UPI mechanism applicable"
            value={value.asbaConfiguration.upiMechanismApplicable}
            onChange={(next) => setAsba({ upiMechanismApplicable: next })}
          />
          <TernaryField
            id="bid-collection-reviewed"
            label="Bid collection configuration reviewed"
            value={value.asbaConfiguration.bidCollectionConfigurationReviewed}
            onChange={(next) => setAsba({ bidCollectionConfigurationReviewed: next })}
          />
          <TernaryField
            id="electronic-application-readiness"
            label="Electronic application readiness"
            value={value.asbaConfiguration.electronicApplicationReadiness}
            onChange={(next) => setAsba({ electronicApplicationReadiness: next })}
          />
          <TernaryField
            id="registrar-reconciliation-ready"
            label="Registrar reconciliation process ready"
            value={value.asbaConfiguration.registrarReconciliationProcessReady}
            onChange={(next) => setAsba({ registrarReconciliationProcessReady: next })}
          />
        </FieldGrid>
      </SubSection>

      <IntermediariesFilingSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
