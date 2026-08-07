"""Postgres API tests for Financials & KPIs persistence."""

import pytest
from httpx import AsyncClient

from tests.conftest import register_payload
from tests.test_onboarding_sme import _full_onboarding_steps

BASE = "/api/v1/workstreams/financials-kpis"


async def _register_and_submit(auth_client: AsyncClient, email: str) -> dict[str, str]:
    register = await auth_client.post(
        "/api/v1/auth/register",
        json=register_payload(email=email),
    )
    token = register.json()["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}

    created = await auth_client.post("/api/v1/onboarding/sme", headers=headers)
    onboarding_id = created.json()["id"]

    for route_suffix, _step, payload in _full_onboarding_steps():
        response = await auth_client.patch(
            f"/api/v1/onboarding/sme/{onboarding_id}/{route_suffix}",
            headers=headers,
            json=payload,
        )
        assert response.status_code == 200, response.text

    submit = await auth_client.post(
        f"/api/v1/onboarding/sme/{onboarding_id}/submit",
        headers=headers,
        json={
            "submissionConfirmations": {
                "confirmAccuracy": True,
                "confirmAuthorised": True,
                "confirmVerification": True,
                "agreeTerms": True,
            },
        },
    )
    assert submit.status_code == 200
    return headers


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_initialize_workspace_is_idempotent(auth_client: AsyncClient) -> None:
    headers = await _register_and_submit(auth_client, "financials-kpis.init@example.com")

    first = await auth_client.post(f"{BASE}/workspace", headers=headers)
    assert first.status_code == 200
    first_body = first.json()
    assert first_body["created"] is True
    assert first_body["version"] == 1
    assert first_body["payload"]["schemaVersion"] == 1
    assert first_body["payload"]["reportingScopePeriodsAndAuditorReadiness"]["financialPeriods"] == []
    assert first_body["linkedReferences"]["company"]["available"] is False
    assert first_body["progress"]["sectionsComplete"] == 0
    assert first_body["progress"]["totalSections"] == 8

    second = await auth_client.post(f"{BASE}/workspace", headers=headers)
    assert second.status_code == 200
    second_body = second.json()
    assert second_body["created"] is False
    assert second_body["id"] == first_body["id"]
    assert second_body["version"] == first_body["version"]


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_save_load_all_sections_version_conflict_and_assessment(
    auth_client: AsyncClient,
) -> None:
    headers = await _register_and_submit(auth_client, "financials-kpis.save@example.com")
    init = await auth_client.post(f"{BASE}/workspace", headers=headers)
    assert init.status_code == 200
    version = init.json()["version"]
    payload = init.json()["payload"]

    # 1. Reporting scope, periods & auditor readiness
    reporting_scope = payload["reportingScopePeriodsAndAuditorReadiness"]
    reporting_scope["reportingBasis"].update(
        {
            "financialYearEnd": "31-03",
            "accountingFramework": "ind-as",
            "financialPresentation": "standalone",
            "currency": "INR",
            "displayUnit": "lakh",
            "ociApplies": "yes",
            "cashFlowAvailable": "yes",
        }
    )
    reporting_scope["financialPeriods"] = [
        {
            "id": "fy-2022",
            "label": "FY 2022",
            "startDate": "2021-04-01",
            "endDate": "2022-03-31",
            "months": "12",
            "fullYearOrInterim": "full-year",
            "comparablePeriodId": "",
            "basis": "standalone",
            "auditedStatus": "audited",
            "restatedStatus": "restated",
            "boardApprovalStatus": "approved",
            "auditReportDate": "2022-09-30",
            "restatementReportDate": "2024-01-15",
            "sourceStatus": "restated_financial_information",
            "finalisationStatus": "finalised",
            "notes": "",
        },
        {
            "id": "fy-2023",
            "label": "FY 2023",
            "startDate": "2022-04-01",
            "endDate": "2023-03-31",
            "months": "12",
            "fullYearOrInterim": "full-year",
            "comparablePeriodId": "fy-2022",
            "basis": "standalone",
            "auditedStatus": "audited",
            "restatedStatus": "restated",
            "boardApprovalStatus": "approved",
            "auditReportDate": "2023-09-30",
            "restatementReportDate": "2024-01-15",
            "sourceStatus": "restated_financial_information",
            "finalisationStatus": "finalised",
            "notes": "",
        },
        {
            "id": "fy-2024",
            "label": "FY 2024",
            "startDate": "2023-04-01",
            "endDate": "2024-03-31",
            "months": "12",
            "fullYearOrInterim": "full-year",
            "comparablePeriodId": "fy-2023",
            "basis": "standalone",
            "auditedStatus": "audited",
            "restatedStatus": "restated",
            "boardApprovalStatus": "approved",
            "auditReportDate": "2024-09-30",
            "restatementReportDate": "2025-01-15",
            "sourceStatus": "restated_financial_information",
            "finalisationStatus": "finalised",
            "notes": "",
        },
    ]
    reporting_scope["auditorReadiness"].update(
        {
            "currentStatutoryAuditor": "ABC & Associates LLP",
            "restatementExerciseStatus": "completed",
        }
    )
    save = await auth_client.patch(
        f"{BASE}/sections/reporting-scope-periods-and-auditor-readiness",
        headers=headers,
        json={"version": version, "data": reporting_scope},
    )
    assert save.status_code == 200, save.text
    saved = save.json()
    assert saved["version"] == version + 1
    assert saved["computations"]["periodCount"] == 3
    assert saved["notification"]["title"] == "Reporting Scope, Periods & Auditor Readiness saved"
    version = saved["version"]

    # 2. Restated statement of profit & loss
    pl = payload["restatedStatementOfProfitAndLoss"]
    pl["plLineValues"] = [
        {
            "id": "pl-1",
            "periodId": "fy-2024",
            "lineKey": "revenueFromOperations",
            "amount": "100000000",
            "sourceStatus": "restated_financial_information",
            "note": "",
            "adjustmentPresent": "no",
            "managementExplanation": "",
            "professionalConfirmationStatus": "confirmed",
        },
        {
            "id": "pl-2",
            "periodId": "fy-2024",
            "lineKey": "totalExpenses",
            "amount": "85000000",
            "sourceStatus": "restated_financial_information",
            "note": "",
            "adjustmentPresent": "no",
            "managementExplanation": "",
            "professionalConfirmationStatus": "confirmed",
        },
        {
            "id": "pl-3",
            "periodId": "fy-2024",
            "lineKey": "profitAfterTax",
            "amount": "12000000",
            "sourceStatus": "restated_financial_information",
            "note": "",
            "adjustmentPresent": "no",
            "managementExplanation": "",
            "professionalConfirmationStatus": "confirmed",
        },
    ]
    pl["perShareByPeriod"] = [
        {
            "id": "ps-1",
            "periodId": "fy-2024",
            "weightedAvgBasicShares": "1000000",
            "weightedAvgDilutedShares": "1000000",
            "basicEps": "12",
            "dilutedEps": "12",
            "faceValue": "10",
            "retrospectiveCapitalAdjustmentApplied": "no",
            "bonusSplitConsolidationAdjustmentStatus": "",
            "notes": "",
        }
    ]
    save = await auth_client.patch(
        f"{BASE}/sections/restated-statement-of-profit-and-loss",
        headers=headers,
        json={"version": version, "data": pl},
    )
    assert save.status_code == 200, save.text
    version = save.json()["version"]
    assert save.json()["computations"]["latestRevenue"] == "100000000"

    # 3. Assets, liabilities, equity & cash flows
    bs = payload["assetsLiabilitiesEquityAndCashFlows"]
    bs["balanceSheetLineValues"] = [
        {
            "id": "bs-1",
            "periodId": "fy-2024",
            "lineKey": "totalAssets",
            "amount": "200000000",
            "sourceStatus": "restated_financial_information",
            "note": "",
        },
        {
            "id": "bs-2",
            "periodId": "fy-2024",
            "lineKey": "totalEquityAndLiabilities",
            "amount": "200000000",
            "sourceStatus": "restated_financial_information",
            "note": "",
        },
        {
            "id": "bs-3",
            "periodId": "fy-2024",
            "lineKey": "equityShareCapital",
            "amount": "10000000",
            "sourceStatus": "restated_financial_information",
            "note": "",
        },
    ]
    bs["cashFlowLineValues"] = [
        {
            "id": "cf-1",
            "periodId": "fy-2024",
            "lineKey": "openingCashAndCashEquivalents",
            "amount": "5000000",
            "sourceStatus": "restated_financial_information",
            "note": "",
        },
        {
            "id": "cf-2",
            "periodId": "fy-2024",
            "lineKey": "netIncreaseDecreaseInCash",
            "amount": "2000000",
            "sourceStatus": "restated_financial_information",
            "note": "",
        },
        {
            "id": "cf-3",
            "periodId": "fy-2024",
            "lineKey": "closingCashAndCashEquivalents",
            "amount": "7000000",
            "sourceStatus": "restated_financial_information",
            "note": "",
        },
    ]
    save = await auth_client.patch(
        f"{BASE}/sections/assets-liabilities-equity-and-cash-flows",
        headers=headers,
        json={"version": version, "data": bs},
    )
    assert save.status_code == 200, save.text
    version = save.json()["version"]

    # 4. Restatement adjustments, policies & auditor matters
    restatement = payload["restatementAdjustmentsPoliciesAndAuditorMatters"]
    restatement["restatementAdjustments"] = [
        {
            "id": "adj-1",
            "periodId": "fy-2024",
            "financialStatement": "profit-and-loss",
            "originalLineItem": "Revenue",
            "originalAuditedAmount": "95000000",
            "adjustmentAmount": "5000000",
            "restatedAmount": "100000000",
            "debitCreditDirection": "credit",
            "category": "prior-period-error",
            "detailedRationale": "Correction of revenue recognition timing",
            "accountingStandardReference": "Ind AS 115",
            "taxEffect": "1250000",
            "cashOrNonCash": "non-cash",
            "recurringOrNonRecurring": "non-recurring",
            "epsImpact": "0.50",
            "netWorthImpact": "3750000",
            "auditorReviewStatus": "reviewed",
            "professionalConclusionStatus": "confirmed",
            "reference": "Note 2.1",
            "notes": "",
        }
    ]
    restatement["auditReportMatters"] = [
        {
            "id": "arm-1",
            "periodId": "fy-2024",
            "auditOpinion": "unmodified",
            "qualificationReservation": "",
            "emphasisOfMatter": "",
            "keyAuditMatter": "Revenue recognition",
            "goingConcernUncertainty": "no",
            "internalFinancialControlQualification": "no",
            "caroRemark": "no",
            "fraudReported": "no",
            "statutoryDuesDefaultDelay": "no",
            "accountingSystemOrAuditTrailConcern": "no",
            "managementResponse": "",
            "adjustedInRestatedInformation": "yes",
            "ifNotAdjustedReason": "",
            "resolutionStatus": "resolved",
            "reference": "Auditor report FY2024",
            "notes": "",
        }
    ]
    save = await auth_client.patch(
        f"{BASE}/sections/restatement-adjustments-policies-and-auditor-matters",
        headers=headers,
        json={"version": version, "data": restatement},
    )
    assert save.status_code == 200, save.text
    version = save.json()["version"]

    # 5. Other financial information
    other = payload["otherFinancialInformation"]
    other["segmentRecords"] = [
        {
            "id": "seg-1",
            "periodId": "fy-2024",
            "linkedBusinessSegmentId": "",
            "segmentName": "Manufacturing",
            "productsServices": "Industrial components",
            "externalRevenue": "100000000",
            "interSegmentRevenue": "",
            "totalSegmentRevenue": "100000000",
            "segmentResult": "15000000",
            "segmentAssets": "120000000",
            "segmentLiabilities": "40000000",
            "capitalExpenditure": "5000000",
            "depreciation": "3000000",
            "reconciliationToCompanyTotals": "Reconciles to company revenue",
            "sourceStatus": "restated_financial_information",
            "notes": "",
        }
    ]
    other["indebtednessSummary"]["totalDebt"] = "50000000"
    other["indebtednessSummary"]["sourceStatus"] = "restated_financial_information"
    save = await auth_client.patch(
        f"{BASE}/sections/other-financial-information",
        headers=headers,
        json={"version": version, "data": other},
    )
    assert save.status_code == 200, save.text
    version = save.json()["version"]

    # 6. Ratios, capitalisation & issue-price metrics
    ratios = payload["ratiosCapitalisationAndIssuePriceMetrics"]
    ratios["formulaRecords"] = [
        {
            "id": "frm-1",
            "metricKey": "ebitda",
            "displayName": "EBITDA",
            "definition": "Earnings before interest, tax, depreciation and amortisation",
            "formula": "PBT + finance costs + depreciation + amortisation",
            "components": "As per audited financials",
            "excludedItems": "Exceptional items",
            "reconciliationToFinancialStatement": "Note 32",
            "comparableAcrossPeriods": "yes",
            "methodologyChanged": "no",
            "changeExplanation": "",
            "sourceStatus": "restated_financial_information",
            "professionalConfirmationStatus": "confirmed",
            "notes": "",
        }
    ]
    ratios["smeEligibilityByPeriod"] = [
        {
            "id": "sme-1",
            "periodId": "fy-2024",
            "operatingProfit": "1400000000",
            "operatingProfitFormula": "PBT + depreciation",
            "netWorth": "80000000",
            "fcfe": "15000000",
            "fcfeFormula": "CFO - capex",
            "sourceStatus": "auditor_certificate",
            "auditorCertificateStatus": "received",
            "notes": "",
        }
    ]
    save = await auth_client.patch(
        f"{BASE}/sections/ratios-capitalisation-and-issue-price-metrics",
        headers=headers,
        json={"version": version, "data": ratios},
    )
    assert save.status_code == 200, save.text
    version = save.json()["version"]

    # 7. KPI selection, governance & peer comparison
    kpi = payload["kpiSelectionGovernanceAndPeerComparison"]
    kpi["selectedDataCandidates"] = [
        {
            "id": "cand-1",
            "metricName": "Capacity utilisation",
            "category": "operational",
            "definition": "Actual output divided by installed capacity",
            "unit": "percentage",
            "valuesByPeriod": [{"periodId": "fy-2024", "value": "78"}],
            "sourceType": "management_accounts",
            "sharedWithInvestorsPriorThreeYears": "no",
            "sharingDateContext": "",
            "relatedCapitalTransaction": "",
            "presentedToBoardAuditCommittee": "yes",
            "historicallyUsedByManagement": "yes",
            "usedInIssuePriceDeliberations": "no",
            "usedByPeers": "yes",
            "verifiable": "yes",
            "certifiable": "yes",
            "containsProjections": "no",
            "confidentialBusinessSensitive": "no",
            "relevantToCurrentBusiness": "yes",
            "proposedTreatment": "include-as-kpi",
            "exclusionRationale": "",
            "managementNotes": "",
        }
    ]
    kpi["kpiRegister"] = [
        {
            "id": "kpi-1",
            "linkedSelectedDataId": "cand-1",
            "name": "Capacity utilisation",
            "category": "operational",
            "drhpLocation": "our-business",
            "plainEnglishDefinition": "Share of installed capacity actually used",
            "formula": "Actual production / installed capacity",
            "numerator": "Actual production",
            "denominator": "Installed capacity",
            "components": "",
            "unit": "percentage",
            "currency": "",
            "frequency": "annual",
            "valuesByPeriod": [{"periodId": "fy-2024", "value": "78"}],
            "source": "management_accounts",
            "dataOwner": "Operations head",
            "whyManagementTracksIt": "Operational efficiency",
            "performanceRelevance": "High",
            "valuationRelevance": "Medium",
            "limitations": "Single plant basis",
            "methodologyChanges": "",
            "comparableAcrossPeriods": "yes",
            "restatementRecalculationRequired": "no",
            "professionalCertificationStatus": "pending",
            "notes": "",
        }
    ]
    kpi["managementCertification"]["status"] = "draft"
    kpi["professionalCertification"]["certificationStatus"] = "pending"
    save = await auth_client.patch(
        f"{BASE}/sections/kpi-selection-governance-and-peer-comparison",
        headers=headers,
        json={"version": version, "data": kpi},
    )
    assert save.status_code == 200, save.text
    version = save.json()["version"]

    # 8. MD&A, trends, material developments & confirmations
    mda = payload["mdaTrendsMaterialDevelopmentsAndConfirmations"]
    mda["performanceFactors"] = [
        {
            "id": "pf-1",
            "title": "Raw material cost increase",
            "category": "cost",
            "affectedFinancialLineItems": "Cost of materials consumed",
            "periodsAffected": "FY 2024",
            "quantifiedImpact": "5000000",
            "explanation": "Steel prices increased during the year",
            "temporaryOrContinuing": "continuing",
            "managementResponse": "Pass-through pricing where possible",
            "linkedRiskFactor": "",
            "supportingSource": "Management accounts",
            "professionalReviewStatus": "pending",
            "notes": "",
        }
    ]
    mda["liquidityCapitalResources"]["principalLiquiditySources"] = (
        "Operating cash flows and working capital facilities"
    )
    mda["confirmations"] = {key: True for key, _label in mda["confirmations"].items()}
    save = await auth_client.patch(
        f"{BASE}/sections/mda-trends-material-developments-and-confirmations",
        headers=headers,
        json={"version": version, "data": mda},
    )
    assert save.status_code == 200, save.text
    version = save.json()["version"]

    stale = await auth_client.patch(
        f"{BASE}/sections/reporting-scope-periods-and-auditor-readiness",
        headers=headers,
        json={"version": 1, "data": reporting_scope},
    )
    assert stale.status_code == 409
    assert stale.json()["error"]["code"] == "FINANCIALS_KPIS_VERSION_CONFLICT"

    loaded = await auth_client.get(f"{BASE}/workspace", headers=headers)
    assert loaded.status_code == 200
    loaded_payload = loaded.json()["payload"]
    assert loaded_payload["restatedStatementOfProfitAndLoss"]["plLineValues"][0]["amount"] == "100000000"

    overview = await auth_client.get(f"{BASE}/overview-summary", headers=headers)
    assert overview.status_code == 200
    overview_body = overview.json()
    assert overview_body["periodLabels"] == ["FY 2022", "FY 2023", "FY 2024"]
    assert overview_body["latestRevenue"] == "100000000"
    assert overview_body["assessmentResult"] in {
        "insufficient_information",
        "broadly_reconciled",
        "inconsistencies_identified",
        "professional_confirmation_required",
        "pending_restatement",
    }

    assessment = await auth_client.get(f"{BASE}/financial-assessment", headers=headers)
    assert assessment.status_code == 200
    assessment_body = assessment.json()
    assert len(assessment_body["groups"]) == 7
    assert assessment_body["metrics"]["periods"] == 3


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_ownership_isolation(auth_client: AsyncClient) -> None:
    headers_a = await _register_and_submit(auth_client, "financials-kpis.a@example.com")
    headers_b = await _register_and_submit(auth_client, "financials-kpis.b@example.com")

    init_a = await auth_client.post(f"{BASE}/workspace", headers=headers_a)
    assert init_a.status_code == 200
    reporting_scope = init_a.json()["payload"]["reportingScopePeriodsAndAuditorReadiness"]
    reporting_scope["reportingBasis"]["financialYearEnd"] = "31-03"
    save_a = await auth_client.patch(
        f"{BASE}/sections/reporting-scope-periods-and-auditor-readiness",
        headers=headers_a,
        json={"version": 1, "data": reporting_scope},
    )
    assert save_a.status_code == 200

    init_b = await auth_client.post(f"{BASE}/workspace", headers=headers_b)
    assert init_b.status_code == 200
    assert (
        init_b.json()["payload"]["reportingScopePeriodsAndAuditorReadiness"]["reportingBasis"][
            "financialYearEnd"
        ]
        == ""
    )

    get_b = await auth_client.get(f"{BASE}/workspace", headers=headers_b)
    assert (
        get_b.json()["payload"]["reportingScopePeriodsAndAuditorReadiness"]["reportingBasis"][
            "financialYearEnd"
        ]
        == ""
    )


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_period_reference_validation(auth_client: AsyncClient) -> None:
    headers = await _register_and_submit(auth_client, "financials-kpis.validate@example.com")
    init = await auth_client.post(f"{BASE}/workspace", headers=headers)
    version = init.json()["version"]
    payload = init.json()["payload"]

    reporting_scope = payload["reportingScopePeriodsAndAuditorReadiness"]
    reporting_scope["financialPeriods"] = [
        {
            "id": "period-keep",
            "label": "FY 2024",
            "startDate": "2023-04-01",
            "endDate": "2024-03-31",
            "months": "12",
            "fullYearOrInterim": "full-year",
            "comparablePeriodId": "",
            "basis": "standalone",
            "auditedStatus": "audited",
            "restatedStatus": "restated",
            "boardApprovalStatus": "",
            "auditReportDate": "",
            "restatementReportDate": "",
            "sourceStatus": "restated_financial_information",
            "finalisationStatus": "finalised",
            "notes": "",
        }
    ]
    save = await auth_client.patch(
        f"{BASE}/sections/reporting-scope-periods-and-auditor-readiness",
        headers=headers,
        json={"version": version, "data": reporting_scope},
    )
    assert save.status_code == 200
    version = save.json()["version"]

    pl = payload["restatedStatementOfProfitAndLoss"]
    pl["plLineValues"] = [
        {
            "id": "pl-1",
            "periodId": "period-keep",
            "lineKey": "revenueFromOperations",
            "amount": "1000000",
            "sourceStatus": "restated_financial_information",
            "note": "",
            "adjustmentPresent": "",
            "managementExplanation": "",
            "professionalConfirmationStatus": "",
        }
    ]
    save = await auth_client.patch(
        f"{BASE}/sections/restated-statement-of-profit-and-loss",
        headers=headers,
        json={"version": version, "data": pl},
    )
    assert save.status_code == 200
    version = save.json()["version"]

    invalid_ref = await auth_client.patch(
        f"{BASE}/sections/restated-statement-of-profit-and-loss",
        headers=headers,
        json={
            "version": version,
            "data": {
                **pl,
                "plLineValues": [{**pl["plLineValues"][0], "periodId": "missing-period"}],
            },
        },
    )
    assert invalid_ref.status_code == 422
    assert invalid_ref.json()["error"]["code"] == "FINANCIALS_KPIS_VALIDATION_FAILED"

    periods_removed = {
        **reporting_scope,
        "financialPeriods": [],
    }
    blocked_delete = await auth_client.patch(
        f"{BASE}/sections/reporting-scope-periods-and-auditor-readiness",
        headers=headers,
        json={"version": version, "data": periods_removed},
    )
    assert blocked_delete.status_code == 422
    assert "referenced" in str(blocked_delete.json()["error"]["details"]["fieldErrors"]).lower()


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_pl_computation_on_save(auth_client: AsyncClient) -> None:
    headers = await _register_and_submit(auth_client, "financials-kpis.compute@example.com")
    init = await auth_client.post(f"{BASE}/workspace", headers=headers)
    payload = init.json()["payload"]

    reporting_scope = payload["reportingScopePeriodsAndAuditorReadiness"]
    reporting_scope["financialPeriods"] = [
        {
            "id": "p1",
            "label": "FY 2024",
            "startDate": "2023-04-01",
            "endDate": "2024-03-31",
            "months": "12",
            "fullYearOrInterim": "full-year",
            "comparablePeriodId": "",
            "basis": "standalone",
            "auditedStatus": "audited",
            "restatedStatus": "restated",
            "boardApprovalStatus": "",
            "auditReportDate": "",
            "restatementReportDate": "",
            "sourceStatus": "restated_financial_information",
            "finalisationStatus": "finalised",
            "notes": "",
        }
    ]
    save = await auth_client.patch(
        f"{BASE}/sections/reporting-scope-periods-and-auditor-readiness",
        headers=headers,
        json={"version": 1, "data": reporting_scope},
    )
    assert save.status_code == 200
    version = save.json()["version"]

    pl = payload["restatedStatementOfProfitAndLoss"]
    pl["plLineValues"] = [
        {
            "id": "r1",
            "periodId": "p1",
            "lineKey": "revenueFromOperations",
            "amount": "10000000",
            "sourceStatus": "restated_financial_information",
            "note": "",
            "adjustmentPresent": "",
            "managementExplanation": "",
            "professionalConfirmationStatus": "",
        },
        {
            "id": "e1",
            "periodId": "p1",
            "lineKey": "employeeBenefitExpenses",
            "amount": "3000000",
            "sourceStatus": "restated_financial_information",
            "note": "",
            "adjustmentPresent": "",
            "managementExplanation": "",
            "professionalConfirmationStatus": "",
        },
        {
            "id": "e2",
            "periodId": "p1",
            "lineKey": "financeCosts",
            "amount": "500000",
            "sourceStatus": "restated_financial_information",
            "note": "",
            "adjustmentPresent": "",
            "managementExplanation": "",
            "professionalConfirmationStatus": "",
        },
    ]
    save = await auth_client.patch(
        f"{BASE}/sections/restated-statement-of-profit-and-loss",
        headers=headers,
        json={"version": version, "data": pl},
    )
    assert save.status_code == 200
    body = save.json()
    assert body["computations"]["latestRevenue"] == "10000000"
    assert body["computations"]["latestProfitAfterTax"] == ""
