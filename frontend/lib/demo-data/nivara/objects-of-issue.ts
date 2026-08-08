import {
  createEmptyBorrowingRepaymentItem,
  createEmptyCapexItem,
  createEmptyDeploymentScheduleRow,
  createEmptyInvestmentItem,
  createEmptyIssueObject,
  createEmptyIssueExpenseItem,
  createEmptyMeansOfFinanceRow,
  createEmptyObjectsOfIssuePayload,
} from '@/lib/objects-of-issue/defaults';
import type { ObjectsOfIssuePayload } from '@/lib/schemas/objects-of-issue';
import { NIVARA_BORROWINGS, NIVARA_CAPITAL, NIVARA_IDS, NIVARA_IPO } from './constants';

const FRESH_ISSUE_GROSS_RUPEES = String(Number(NIVARA_CAPITAL.freshIssueAmountCrore) * 10000000);
const ISSUE_EXPENSES_RUPEES = '72000000';
const NET_PROCEEDS_RUPEES = String(Number(FRESH_ISSUE_GROSS_RUPEES) - Number(ISSUE_EXPENSES_RUPEES));

const CAPEX_ALLOCATION = '58000000';
const WORKING_CAPITAL_ALLOCATION = '32000000';
const DEBT_REPAYMENT_ALLOCATION = '18000000';

export function createNivaraObjectsOfIssuePayload(): ObjectsOfIssuePayload {
  const payload = createEmptyObjectsOfIssuePayload();

  payload.proceedsAndFundingSummary = {
    ...payload.proceedsAndFundingSummary,
    declaredOfferType: NIVARA_IPO.offerType,
    freshIssueGrossProceeds: FRESH_ISSUE_GROSS_RUPEES,
    estimatedIssueRelatedExpenses: ISSUE_EXPENSES_RUPEES,
    issueMadeToRaiseFundsForObjects: 'yes',
    schemeOfArrangementInvolved: 'no',
  };

  payload.objectsRegisterAndAllocation = {
    ...payload.objectsRegisterAndAllocation,
    objects: [
      {
        ...createEmptyIssueObject(NIVARA_IDS.object001),
        objectName: 'Bhosari production line expansion',
        objectCategory: 'capital-expenditure',
        description:
          'Installation of CNC machining cells and auxiliary equipment to expand capacity at the Bhosari facility.',
        estimatedCost: CAPEX_ALLOCATION,
        amountFromNetProceeds: CAPEX_ALLOCATION,
        appraisalStatus: 'not-appraised',
        expectedUtilisationPeriod: 'FY 2025-26 to FY 2026-27',
        priorityRank: '1',
      },
      {
        ...createEmptyIssueObject(NIVARA_IDS.object002),
        objectName: 'Working capital requirements',
        objectCategory: 'working-capital',
        description:
          'Funding inventory, receivables and operational payables linked to expanded manufacturing volumes.',
        estimatedCost: WORKING_CAPITAL_ALLOCATION,
        amountFromNetProceeds: WORKING_CAPITAL_ALLOCATION,
        appraisalStatus: 'not-appraised',
        expectedUtilisationPeriod: 'FY 2025-26',
        priorityRank: '2',
      },
      {
        ...createEmptyIssueObject('nivara-object-003'),
        objectName: 'Repayment of term borrowings',
        objectCategory: 'repayment-prepayment-of-borrowings',
        description: `Partial prepayment of ${NIVARA_BORROWINGS.facilityLabel} availed from ${NIVARA_BORROWINGS.termLoanLender}.`,
        estimatedCost: DEBT_REPAYMENT_ALLOCATION,
        amountFromNetProceeds: DEBT_REPAYMENT_ALLOCATION,
        appraisalStatus: 'not-appraised',
        expectedUtilisationPeriod: 'On receipt of issue proceeds',
        priorityRank: '3',
      },
    ],
    objectsAreFinalised: 'yes',
  };

  payload.capitalExpenditureFacilitiesAndExpansion = {
    ...payload.capitalExpenditureFacilitiesAndExpansion,
    capexItems: [
      {
        ...createEmptyCapexItem('nivara-capex-bhosari-line'),
        itemType: 'facility-expansion',
        description: 'Additional CNC lines, tooling and material handling for Bhosari unit',
        location: 'MIDC Bhosari, Pune',
        relatedObjectId: NIVARA_IDS.object001,
        estimatedCost: CAPEX_ALLOCATION,
        expectedCommissioningDate: '2026-09-30',
        quotationSource: 'multiple-quotations',
        relatedPartyPurchase: 'no',
        governmentApprovalsRequired: 'no',
        approvalsStatus: 'not-required',
      },
    ],
  };

  payload.workingCapitalAndBorrowingRepayment = {
    ...payload.workingCapitalAndBorrowingRepayment,
    workingCapitalRequirementAmount: WORKING_CAPITAL_ALLOCATION,
    workingCapitalMethodology: 'turnover-method',
    workingCapitalAppraisalStatus: 'not-appraised',
    borrowingRepaymentItems: [
      {
        ...createEmptyBorrowingRepaymentItem('nivara-borrowing-repayment-001'),
        lenderName: NIVARA_BORROWINGS.termLoanLender,
        loanType: 'term-loan',
        outstandingAmount: NIVARA_BORROWINGS.termLoanOutstanding,
        amountProposedForRepayment: DEBT_REPAYMENT_ALLOCATION,
        interestRatePercentage: '9.25',
        isRelatedPartyLender: 'no',
        repaymentRationale: `Reduce leverage by prepaying a portion of ${NIVARA_BORROWINGS.facilityLabel}.`,
        notes: `Facility reference: ${NIVARA_BORROWINGS.facilityLabel}`,
      },
    ],
  };

  payload.acquisitionsSubsidiariesJvsAndInvestments = {
    ...payload.acquisitionsSubsidiariesJvsAndInvestments,
    investmentItems: [
      {
        ...createEmptyInvestmentItem('nivara-acquisition-not-applicable'),
        targetEntityName: 'Not applicable — no acquisition object in register',
        transactionType: 'other',
        estimatedAmount: '0',
        rationale:
          'The objects register does not include any acquisition or investment object; no such utilisation is proposed.',
      },
    ],
    notes:
      'No acquisitions, joint ventures or strategic investments are proposed from the proceeds of the present issue. The objects register comprises capital expenditure, working capital and borrowing repayment only.',
  };

  payload.meansOfFinanceAndDeploymentSchedule = {
    ...payload.meansOfFinanceAndDeploymentSchedule,
    meansOfFinanceRows: [
      {
        ...createEmptyMeansOfFinanceRow('nivara-mof-net-proceeds'),
        source: 'net-proceeds-of-the-issue',
        amount: NET_PROCEEDS_RUPEES,
        notes: 'Primary source for all stated objects',
      },
    ],
    deploymentScheduleRows: [
      {
        ...createEmptyDeploymentScheduleRow('nivara-deploy-fy2025-26'),
        periodLabel: 'FY 2025-26',
        amountToBeDeployed: String(Number(CAPEX_ALLOCATION) + Number(WORKING_CAPITAL_ALLOCATION)),
        notes: 'Bhosari capex and working capital utilisation per objects register',
      },
      {
        ...createEmptyDeploymentScheduleRow('nivara-deploy-on-receipt'),
        periodLabel: 'On receipt of issue proceeds',
        amountToBeDeployed: DEBT_REPAYMENT_ALLOCATION,
        notes: `Partial prepayment of ${NIVARA_BORROWINGS.facilityLabel}`,
      },
    ],
    fundingTieUpStatus: 'partially-tied-up',
    fundingTieUpDetails: 'Issue proceeds expected to fund the full object requirement upon listing.',
  };

  payload.expensesGcpMonitoringAndConfirmations = {
    ...payload.expensesGcpMonitoringAndConfirmations,
    issueExpenseItems: [
      {
        ...createEmptyIssueExpenseItem('nivara-issue-expense-lead-manager'),
        expenseCategory: 'lead-manager-and-underwriting-fees',
        estimatedAmount: '36000000',
      },
      {
        ...createEmptyIssueExpenseItem('nivara-issue-expense-professional'),
        expenseCategory: 'legal-and-professional-fees',
        estimatedAmount: '18000000',
      },
      {
        ...createEmptyIssueExpenseItem('nivara-issue-expense-marketing'),
        expenseCategory: 'advertising-and-marketing',
        estimatedAmount: '18000000',
      },
    ],
    generalCorporatePurposesAmount: '0',
    monitoringAgencyRequired: 'no',
  };

  return payload;
}
