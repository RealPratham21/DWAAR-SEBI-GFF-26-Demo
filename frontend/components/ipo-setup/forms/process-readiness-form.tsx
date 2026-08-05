'use client';

import { SectionCard } from '@/components/company-incorporation/form-primitives';
import { SelectField, TextInputField } from '@/components/ipo-setup/form-helpers';
import { IpoSectionSaveActions } from '@/components/ipo-setup/section-save-actions';
import { useIpoSetup } from '@/lib/ipo-setup/context';
import {
  appointmentStatusOptions,
  approvalStatusOptions,
  connectivityStatusOptions,
  inPrincipleStatusOptions,
  shareholderApprovalStatusOptions,
  yesNoNotSureOptions,
} from '@/lib/ipo-setup/options';
import type { ProcessReadiness } from '@/lib/schemas/ipo-setup';

export function ProcessReadinessForm() {
  const { payload, updateSection } = useIpoSetup();
  const value = payload.processReadiness;

  const set = <K extends keyof ProcessReadiness>(key: K, next: ProcessReadiness[K]) => {
    updateSection('processReadiness', { ...value, [key]: next }, 'process-readiness');
  };

  return (
    <SectionCard
      title="Process Readiness"
      description="Capture approval, dematerialisation and appointment statuses only — not detailed intermediary profiles."
    >
      <div className="space-y-6">
        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">Corporate approvals</h4>
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              id="boardApprovalStatus"
              label="Board approval status"
              value={value.boardApprovalStatus}
              onChange={(next) =>
                set('boardApprovalStatus', next as ProcessReadiness['boardApprovalStatus'])
              }
              options={approvalStatusOptions}
            />
            <TextInputField
              id="boardResolutionDate"
              label="Board resolution date"
              type="date"
              value={value.boardResolutionDate}
              onChange={(next) => set('boardResolutionDate', next)}
            />
            <TextInputField
              id="boardResolutionReference"
              label="Board resolution reference"
              value={value.boardResolutionReference}
              onChange={(next) => set('boardResolutionReference', next)}
            />
            <SelectField
              id="shareholderApprovalStatus"
              label="Shareholder approval status"
              value={value.shareholderApprovalStatus}
              onChange={(next) =>
                set(
                  'shareholderApprovalStatus',
                  next as ProcessReadiness['shareholderApprovalStatus'],
                )
              }
              options={shareholderApprovalStatusOptions}
            />
            <TextInputField
              id="shareholderResolutionDate"
              label="Shareholder resolution date"
              type="date"
              value={value.shareholderResolutionDate}
              onChange={(next) => set('shareholderResolutionDate', next)}
            />
            <TextInputField
              id="shareholderResolutionReference"
              label="Shareholder resolution reference"
              value={value.shareholderResolutionReference}
              onChange={(next) => set('shareholderResolutionReference', next)}
            />
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">
            Dematerialisation & depository
          </h4>
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              id="existingSharesFullyDematerialised"
              label="Existing shares fully dematerialised"
              value={value.existingSharesFullyDematerialised}
              onChange={(next) =>
                set(
                  'existingSharesFullyDematerialised',
                  next as ProcessReadiness['existingSharesFullyDematerialised'],
                )
              }
              options={yesNoNotSureOptions}
            />
            <SelectField
              id="isinAllotted"
              label="ISIN allotted"
              value={value.isinAllotted}
              onChange={(next) => set('isinAllotted', next as ProcessReadiness['isinAllotted'])}
              options={yesNoNotSureOptions}
            />
            <SelectField
              id="nsdlConnectivityStatus"
              label="NSDL connectivity status"
              value={value.nsdlConnectivityStatus}
              onChange={(next) =>
                set('nsdlConnectivityStatus', next as ProcessReadiness['nsdlConnectivityStatus'])
              }
              options={connectivityStatusOptions}
            />
            <SelectField
              id="cdslConnectivityStatus"
              label="CDSL connectivity status"
              value={value.cdslConnectivityStatus}
              onChange={(next) =>
                set('cdslConnectivityStatus', next as ProcessReadiness['cdslConnectivityStatus'])
              }
              options={connectivityStatusOptions}
            />
            <SelectField
              id="rtaArrangementsInitiated"
              label="RTA arrangements initiated"
              value={value.rtaArrangementsInitiated}
              onChange={(next) =>
                set(
                  'rtaArrangementsInitiated',
                  next as ProcessReadiness['rtaArrangementsInitiated'],
                )
              }
              options={yesNoNotSureOptions}
            />
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">Appointment statuses</h4>
          <div className="grid gap-4 md:grid-cols-2">
            {(
              [
                ['leadManagerAppointmentStatus', 'Lead manager'],
                ['registrarAppointmentStatus', 'Registrar to the issue'],
                ['marketMakerAppointmentStatus', 'Market maker'],
                ['underwriterAppointmentStatus', 'Underwriter'],
                ['legalAdviserAppointmentStatus', 'Legal adviser'],
                ['statutoryAuditorCoordinationStatus', 'Statutory auditor coordination'],
              ] as const
            ).map(([key, label]) => (
              <SelectField
                key={key}
                id={key}
                label={label}
                value={value[key]}
                onChange={(next) => set(key, next as ProcessReadiness[typeof key])}
                options={appointmentStatusOptions}
              />
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">Exchange process</h4>
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              id="inPrincipleApplicationStatus"
              label="In-principle application status"
              value={value.inPrincipleApplicationStatus}
              onChange={(next) =>
                set(
                  'inPrincipleApplicationStatus',
                  next as ProcessReadiness['inPrincipleApplicationStatus'],
                )
              }
              options={inPrincipleStatusOptions}
            />
            <TextInputField
              id="inPrincipleApplicationDate"
              label="Application date"
              type="date"
              value={value.inPrincipleApplicationDate}
              onChange={(next) => set('inPrincipleApplicationDate', next)}
            />
            <TextInputField
              id="inPrincipleApplicationReference"
              label="Application reference"
              value={value.inPrincipleApplicationReference}
              onChange={(next) => set('inPrincipleApplicationReference', next)}
            />
            <SelectField
              id="clarificationsReceived"
              label="Clarifications received"
              value={value.clarificationsReceived}
              onChange={(next) =>
                set('clarificationsReceived', next as ProcessReadiness['clarificationsReceived'])
              }
              options={yesNoNotSureOptions}
            />
            <SelectField
              id="inPrincipleApprovalReceived"
              label="In-principle approval received"
              value={value.inPrincipleApprovalReceived}
              onChange={(next) =>
                set(
                  'inPrincipleApprovalReceived',
                  next as ProcessReadiness['inPrincipleApprovalReceived'],
                )
              }
              options={yesNoNotSureOptions}
            />
            <TextInputField
              id="inPrincipleApprovalDate"
              label="Approval date"
              type="date"
              value={value.inPrincipleApprovalDate}
              onChange={(next) => set('inPrincipleApprovalDate', next)}
            />
            <TextInputField
              id="inPrincipleApprovalReference"
              label="Approval reference"
              value={value.inPrincipleApprovalReference}
              onChange={(next) => set('inPrincipleApprovalReference', next)}
            />
          </div>
        </div>
      </div>

      <IpoSectionSaveActions sectionId="process-readiness" />
    </SectionCard>
  );
}
