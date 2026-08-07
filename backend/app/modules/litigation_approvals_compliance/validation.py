"""Draft-tolerant section validation for Litigation, Approvals & Compliance."""

from __future__ import annotations

from typing import Any, Callable

from app.modules.litigation_approvals_compliance.approvals import approval_ids
from app.modules.litigation_approvals_compliance.constants import (
    APPROVAL_CATEGORY,
    APPROVAL_CONDITION_CATEGORY,
    APPROVAL_HOLDER_TYPE,
    APPROVAL_STATUS,
    COMPLIANCE_DOMAIN,
    COMPLIANCE_ISSUE_TYPE,
    CONDITION_COMPLIANCE_STATUS,
    CONTINUATION_PENDING_RENEWAL,
    CURRENT_HISTORICAL,
    FORUM_CATEGORY,
    ISSUE_IDENTIFIED_BY,
    LAC_CONFIRMATION_FIELDS,
    LEGAL_PARTY_CATEGORY,
    MATERIALITY_METRIC_TYPE,
    MATERIAL_CREDITOR_THRESHOLD_TYPE,
    MATERIAL_DEVELOPMENT_CATEGORY,
    MATTER_CATEGORY,
    MATTER_DIRECTION,
    MATTER_MATERIALITY_STATE,
    MATTER_OUTCOME_STATUS,
    MATTER_PARTY_ROLE,
    PROCEEDING_STAGE,
    PROFESSIONAL_CONFIRMATION_STATUS,
    QUALITATIVE_CRITERION_TYPE,
    READINESS_STATE,
    RECONCILIATION_STATUS,
    REGULATORY_ACTION_TYPE,
    REMEDIATION_LINKED_RECORD_TYPE,
    REMEDIATION_PRIORITY,
    REMEDIATION_STATUS,
    REQUIRED_BEFORE,
    STANDALONE_CONSOLIDATED,
    STATUTORY_DUE_TYPE,
    TAX_TYPE,
    YES_NO_NOT_SURE,
)
from app.modules.litigation_approvals_compliance.decimal_utils import is_invalid
from app.modules.litigation_approvals_compliance.matters import matter_ids
from app.modules.litigation_approvals_compliance.references import (
    count_approval_references,
    count_matter_references,
    format_approval_dependency_message,
    format_matter_dependency_message,
)


class ValidationError(Exception):
    def __init__(self, field_errors: dict[str, str]) -> None:
        self.field_errors = field_errors
        super().__init__("validation failed")


def _require_enum(errors: dict[str, str], field: str, value: Any, allowed: frozenset[str]) -> None:
    text = "" if value is None else str(value)
    if text not in allowed:
        errors[field] = "Select a valid option."


def _ynns(errors: dict[str, str], field: str, value: Any) -> None:
    _require_enum(errors, field, value if value is not None else "", YES_NO_NOT_SURE)


def _optional_decimal(errors: dict[str, str], field: str, value: Any) -> None:
    if value is None or str(value).strip() == "":
        return
    if is_invalid(value):
        errors[field] = "Enter a valid decimal value."


def _check_unique_ids(
    errors: dict[str, str],
    field: str,
    items: list[Any],
    id_key: str,
) -> None:
    if not isinstance(items, list):
        errors[field] = "Must be a list."
        return
    seen: set[str] = set()
    for index, item in enumerate(items):
        if not isinstance(item, dict):
            errors[f"{field}[{index}]"] = "Invalid record."
            continue
        item_id = str(item.get(id_key) or "").strip()
        if not item_id:
            errors[f"{field}[{index}].{id_key}"] = "Record id is required."
            continue
        if item_id in seen:
            errors[f"{field}[{index}].{id_key}"] = "Duplicate id within this collection."
        seen.add(item_id)


def _optional_matter_ref(
    errors: dict[str, str],
    field: str,
    value: Any,
    valid_ids: set[str],
) -> None:
    ref = str(value or "").strip()
    if not ref:
        return
    if ref not in valid_ids:
        errors[field] = "References a matter that does not exist in the Matter Master."


def _optional_approval_ref(
    errors: dict[str, str],
    field: str,
    value: Any,
    valid_ids: set[str],
) -> None:
    ref = str(value or "").strip()
    if not ref:
        return
    if ref not in valid_ids:
        errors[field] = "References an approval that does not exist in the Approval Master."


def _validate_matter_deletions(
    errors: dict[str, str],
    full_payload: dict[str, Any],
    new_matters: list[Any] | None,
) -> None:
    old_ids = matter_ids(full_payload)
    new_ids = {
        str(item.get("matterId"))
        for item in (new_matters or [])
        if isinstance(item, dict) and item.get("matterId")
    }
    merged = dict(full_payload)
    merged["litigationAndProceedingsMaster"] = {
        **(full_payload.get("litigationAndProceedingsMaster") or {}),
        "matters": new_matters or [],
    }
    for removed_id in old_ids - new_ids:
        deps = count_matter_references(merged, removed_id)
        if deps:
            errors["matters"] = format_matter_dependency_message(merged, removed_id, deps)


def _validate_approval_deletions(
    errors: dict[str, str],
    full_payload: dict[str, Any],
    new_approvals: list[Any] | None,
) -> None:
    old_ids = approval_ids(full_payload)
    new_ids = {
        str(item.get("approvalId"))
        for item in (new_approvals or [])
        if isinstance(item, dict) and item.get("approvalId")
    }
    merged = dict(full_payload)
    merged["governmentRegulatoryAndBusinessApprovalsMaster"] = {
        **(full_payload.get("governmentRegulatoryAndBusinessApprovalsMaster") or {}),
        "approvals": new_approvals or [],
    }
    for removed_id in old_ids - new_ids:
        deps = count_approval_references(merged, removed_id)
        if deps:
            errors["approvals"] = format_approval_dependency_message(merged, removed_id, deps)


def validate_legal_universe(section: dict[str, Any], full_payload: dict[str, Any]) -> None:
    del full_payload
    errors: dict[str, str] = {}
    snapshot = section.get("legalDdSnapshot") or {}
    for field in (
        "litigationExists",
        "criminalMattersExist",
        "taxDisputesExist",
        "regulatoryStatutoryActionsExist",
        "civilArbitrationMattersExist",
        "sebiExchangeActionsExist",
        "materialApprovalsPending",
        "expiredApprovalsExist",
        "knownComplianceExceptionsExist",
        "materialCreditorDuesExist",
        "materialDevelopmentsSinceLatestFinancialsExist",
    ):
        _ynns(errors, f"legalDdSnapshot.{field}", snapshot.get(field))

    _check_unique_ids(errors, "legalPartyReviews", section.get("legalPartyReviews") or [], "legalPartyReviewId")
    for index, party in enumerate(section.get("legalPartyReviews") or []):
        if not isinstance(party, dict):
            continue
        prefix = f"legalPartyReviews[{index}]"
        _require_enum(errors, f"{prefix}.partyCategory", party.get("partyCategory"), LEGAL_PARTY_CATEGORY)
        _require_enum(errors, f"{prefix}.currentHistorical", party.get("currentHistorical"), CURRENT_HISTORICAL)
        _ynns(errors, f"{prefix}.legalSearchCompleted", party.get("legalSearchCompleted"))
        _require_enum(
            errors,
            f"{prefix}.externalCounselReviewStatus",
            party.get("externalCounselReviewStatus"),
            PROFESSIONAL_CONFIRMATION_STATUS,
        )

    policy = section.get("litigationMaterialityPolicy") or {}
    for field in ("policyExists", "adopted"):
        _ynns(errors, f"litigationMaterialityPolicy.{field}", policy.get(field))
    for field in ("legalCounselReview", "brlmProfessionalReview"):
        _require_enum(errors, f"litigationMaterialityPolicy.{field}", policy.get(field), PROFESSIONAL_CONFIRMATION_STATUS)

    _check_unique_ids(
        errors,
        "quantitativeMaterialityCriteria",
        section.get("quantitativeMaterialityCriteria") or [],
        "materialityCriterionId",
    )
    for index, criterion in enumerate(section.get("quantitativeMaterialityCriteria") or []):
        if not isinstance(criterion, dict):
            continue
        prefix = f"quantitativeMaterialityCriteria[{index}]"
        _require_enum(errors, f"{prefix}.metric", criterion.get("metric"), MATERIALITY_METRIC_TYPE)
        _require_enum(
            errors,
            f"{prefix}.standaloneConsolidatedBasis",
            criterion.get("standaloneConsolidatedBasis"),
            STANDALONE_CONSOLIDATED,
        )
        _optional_decimal(errors, f"{prefix}.percentageThreshold", criterion.get("percentageThreshold"))
        _optional_decimal(errors, f"{prefix}.absoluteThreshold", criterion.get("absoluteThreshold"))
        _optional_decimal(errors, f"{prefix}.sourceFinancialValue", criterion.get("sourceFinancialValue"))

    _check_unique_ids(
        errors,
        "qualitativeMaterialityCriteria",
        section.get("qualitativeMaterialityCriteria") or [],
        "qualitativeCriterionId",
    )
    for index, criterion in enumerate(section.get("qualitativeMaterialityCriteria") or []):
        if not isinstance(criterion, dict):
            continue
        prefix = f"qualitativeMaterialityCriteria[{index}]"
        _require_enum(errors, f"{prefix}.criterionType", criterion.get("criterionType"), QUALITATIVE_CRITERION_TYPE)
        _ynns(errors, f"{prefix}.enabled", criterion.get("enabled"))

    if errors:
        raise ValidationError(errors)


def validate_litigation_master(section: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    matters = section.get("matters") or []
    _check_unique_ids(errors, "matters", matters, "matterId")
    _validate_matter_deletions(errors, full_payload, matters)

    valid_approval_ids = approval_ids(full_payload)
    for index, matter in enumerate(matters):
        if not isinstance(matter, dict):
            continue
        prefix = f"matters[{index}]"
        identity = matter.get("identity") or {}
        _require_enum(errors, f"{prefix}.identity.category", identity.get("category"), MATTER_CATEGORY)
        _require_enum(errors, f"{prefix}.identity.direction", identity.get("direction"), MATTER_DIRECTION)
        forum = matter.get("forum") or {}
        _require_enum(errors, f"{prefix}.forum.forumCategory", forum.get("forumCategory"), FORUM_CATEGORY)
        dates = matter.get("datesAndStage") or {}
        _require_enum(errors, f"{prefix}.datesAndStage.currentStage", dates.get("currentStage"), PROCEEDING_STAGE)
        for field in (
            "currentSubsisting",
            "interimOrderExists",
            "stayExists",
            "injunctionExists",
            "attachmentFreezingOrderExists",
            "appealAvailable",
            "appealFiled",
        ):
            _ynns(errors, f"{prefix}.datesAndStage.{field}", dates.get(field))
        subject = matter.get("subjectMatter") or {}
        _optional_approval_ref(
            errors,
            f"{prefix}.subjectMatter.linkedApprovalId",
            subject.get("linkedApprovalId"),
            valid_approval_ids,
        )
        amounts = matter.get("amounts") or {}
        for field in (
            "principalClaim",
            "taxDemand",
            "interest",
            "penalty",
            "fine",
            "damages",
            "compensation",
            "otherExposure",
            "totalQuantifiedAmount",
            "amountDisputed",
            "amountPaidDepositedUnderProtest",
            "provisionRecognised",
            "contingentLiabilityRecognised",
        ):
            _optional_decimal(errors, f"{prefix}.amounts.{field}", amounts.get(field))
        _ynns(errors, f"{prefix}.amounts.amountUnquantifiable", amounts.get("amountUnquantifiable"))
        status = matter.get("statusOutcome") or {}
        _require_enum(errors, f"{prefix}.statusOutcome.outcomeStatus", status.get("outcomeStatus"), MATTER_OUTCOME_STATUS)
        materiality = matter.get("materiality") or {}
        for field in (
            "mandatoryCategoryConsideration",
            "quantitativePolicyRelevance",
            "qualitativePolicyRelevance",
        ):
            _ynns(errors, f"{prefix}.materiality.{field}", materiality.get(field))
        _require_enum(
            errors,
            f"{prefix}.materiality.readinessState",
            materiality.get("readinessState"),
            MATTER_MATERIALITY_STATE,
        )
        _require_enum(
            errors,
            f"{prefix}.materiality.professionalReview",
            materiality.get("professionalReview"),
            PROFESSIONAL_CONFIRMATION_STATUS,
        )

    if errors:
        raise ValidationError(errors)


def validate_criminal_regulatory_tax(section: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    valid_matter_ids = matter_ids(full_payload)

    for index, screening in enumerate(section.get("criminalScreenings") or []):
        if not isinstance(screening, dict):
            continue
        prefix = f"criminalScreenings[{index}]"
        for field in (
            "criminalSearchCompleted",
            "complaintsIdentified",
            "firsIdentified",
            "chargeSheetsIdentified",
            "summonsIdentified",
            "prosecutionsIdentified",
            "economicOffenceMattersIdentified",
            "convictionsIdentified",
            "acquittalsIdentified",
            "appealsIdentified",
            "investigationsIdentified",
        ):
            _ynns(errors, f"{prefix}.{field}", screening.get(field))
        for matter_index, matter_id in enumerate(screening.get("linkedMatterIds") or []):
            _optional_matter_ref(
                errors,
                f"{prefix}.linkedMatterIds[{matter_index}]",
                matter_id,
                valid_matter_ids,
            )
        _require_enum(
            errors,
            f"{prefix}.professionalConfirmation",
            screening.get("professionalConfirmation"),
            PROFESSIONAL_CONFIRMATION_STATUS,
        )

    _check_unique_ids(errors, "regulatoryActions", section.get("regulatoryActions") or [], "regulatoryActionId")
    for index, action in enumerate(section.get("regulatoryActions") or []):
        if not isinstance(action, dict):
            continue
        prefix = f"regulatoryActions[{index}]"
        _optional_matter_ref(errors, f"{prefix}.matterId", action.get("matterId"), valid_matter_ids)
        _require_enum(errors, f"{prefix}.actionType", action.get("actionType"), REGULATORY_ACTION_TYPE)
        _optional_decimal(errors, f"{prefix}.monetaryAmount", action.get("monetaryAmount"))
        for field in ("responseSubmitted", "orderPassed", "appealFiled", "repeatIssue"):
            _ynns(errors, f"{prefix}.{field}", action.get(field))

    for index, screening in enumerate(section.get("sebiExchangeScreenings") or []):
        if not isinstance(screening, dict):
            continue
        prefix = f"sebiExchangeScreenings[{index}]"
        for field in (
            "sebiActionExists",
            "stockExchangeActionExists",
            "lastFiveYearRelevance",
            "outstandingAction",
            "showCauseNotice",
            "monetaryPenalty",
            "debarment",
            "securitiesMarketRestraint",
            "settlement",
            "consentOrder",
            "adjudication",
            "appeal",
        ):
            _ynns(errors, f"{prefix}.{field}", screening.get(field))
        _optional_matter_ref(errors, f"{prefix}.linkedMatterId", screening.get("linkedMatterId"), valid_matter_ids)

    for index, detail in enumerate(section.get("taxProceedingDetails") or []):
        if not isinstance(detail, dict):
            continue
        prefix = f"taxProceedingDetails[{index}]"
        _optional_matter_ref(errors, f"{prefix}.matterId", detail.get("matterId"), valid_matter_ids)
        _require_enum(errors, f"{prefix}.taxType", detail.get("taxType"), TAX_TYPE)
        for field in ("demand", "interest", "penalty", "amountPaid", "preDeposit", "balanceDisputed"):
            _optional_decimal(errors, f"{prefix}.{field}", detail.get(field))
        _ynns(errors, f"{prefix}.stayGranted", detail.get("stayGranted"))

    if errors:
        raise ValidationError(errors)


def validate_approvals_master(section: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    approvals = section.get("approvals") or []
    _check_unique_ids(errors, "approvals", approvals, "approvalId")
    _validate_approval_deletions(errors, full_payload, approvals)

    for index, approval in enumerate(approvals):
        if not isinstance(approval, dict):
            continue
        prefix = f"approvals[{index}]"
        identity = approval.get("identity") or {}
        holder = approval.get("holder") or {}
        details = approval.get("details") or {}
        renewal = approval.get("renewalMetadata") or {}
        _require_enum(errors, f"{prefix}.identity.category", identity.get("category"), APPROVAL_CATEGORY)
        _require_enum(errors, f"{prefix}.holder.holderType", holder.get("holderType"), APPROVAL_HOLDER_TYPE)
        _require_enum(errors, f"{prefix}.status", approval.get("status"), APPROVAL_STATUS)
        _ynns(errors, f"{prefix}.details.perpetualNoExpiry", details.get("perpetualNoExpiry"))
        _require_enum(
            errors,
            f"{prefix}.renewalMetadata.continuationPendingRenewal",
            renewal.get("continuationPendingRenewal"),
            CONTINUATION_PENDING_RENEWAL,
        )

    if errors:
        raise ValidationError(errors)


def validate_approval_conditions(section: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    valid_approval_ids = approval_ids(full_payload)

    _check_unique_ids(errors, "approvalConditions", section.get("approvalConditions") or [], "conditionId")
    for index, condition in enumerate(section.get("approvalConditions") or []):
        if not isinstance(condition, dict):
            continue
        prefix = f"approvalConditions[{index}]"
        _optional_approval_ref(errors, f"{prefix}.approvalId", condition.get("approvalId"), valid_approval_ids)
        _require_enum(errors, f"{prefix}.category", condition.get("category"), APPROVAL_CONDITION_CATEGORY)
        _require_enum(
            errors,
            f"{prefix}.complianceStatus",
            condition.get("complianceStatus"),
            CONDITION_COMPLIANCE_STATUS,
        )

    _check_unique_ids(
        errors,
        "facilityApprovalReviews",
        section.get("facilityApprovalReviews") or [],
        "facilityApprovalReviewId",
    )
    for index, review in enumerate(section.get("facilityApprovalReviews") or []):
        if not isinstance(review, dict):
            continue
        prefix = f"facilityApprovalReviews[{index}]"
        for approval_index, approval_id in enumerate(review.get("linkedApprovalIds") or []):
            _optional_approval_ref(
                errors,
                f"{prefix}.linkedApprovalIds[{approval_index}]",
                approval_id,
                valid_approval_ids,
            )
        for category_index, category in enumerate(review.get("requiredApprovalCategoriesIdentified") or []):
            if category not in APPROVAL_CATEGORY - {""}:
                errors[f"{prefix}.requiredApprovalCategoriesIdentified[{category_index}]"] = (
                    "Select a valid approval category."
                )

    _check_unique_ids(
        errors,
        "projectApprovalRequirements",
        section.get("projectApprovalRequirements") or [],
        "projectApprovalRequirementId",
    )
    for index, requirement in enumerate(section.get("projectApprovalRequirements") or []):
        if not isinstance(requirement, dict):
            continue
        prefix = f"projectApprovalRequirements[{index}]"
        _require_enum(
            errors,
            f"{prefix}.approvalCategory",
            requirement.get("approvalCategory"),
            APPROVAL_CATEGORY,
        )
        _optional_approval_ref(
            errors,
            f"{prefix}.linkedApprovalId",
            requirement.get("linkedApprovalId"),
            valid_approval_ids,
        )
        _require_enum(errors, f"{prefix}.requiredBefore", requirement.get("requiredBefore"), REQUIRED_BEFORE)

    if errors:
        raise ValidationError(errors)


def validate_compliance_exceptions(section: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    valid_matter_ids = matter_ids(full_payload)

    _check_unique_ids(
        errors,
        "complianceDomainReviews",
        section.get("complianceDomainReviews") or [],
        "domainReviewId",
    )
    for index, review in enumerate(section.get("complianceDomainReviews") or []):
        if not isinstance(review, dict):
            continue
        prefix = f"complianceDomainReviews[{index}]"
        _require_enum(errors, f"{prefix}.domain", review.get("domain"), COMPLIANCE_DOMAIN)
        _ynns(errors, f"{prefix}.applicable", review.get("applicable"))
        _ynns(errors, f"{prefix}.knownExceptions", review.get("knownExceptions"))

    _check_unique_ids(errors, "complianceIssues", section.get("complianceIssues") or [], "complianceIssueId")
    for index, issue in enumerate(section.get("complianceIssues") or []):
        if not isinstance(issue, dict):
            continue
        prefix = f"complianceIssues[{index}]"
        _require_enum(errors, f"{prefix}.domain", issue.get("domain"), COMPLIANCE_DOMAIN)
        _require_enum(errors, f"{prefix}.issueType", issue.get("issueType"), COMPLIANCE_ISSUE_TYPE)
        _require_enum(errors, f"{prefix}.identifiedBy", issue.get("identifiedBy"), ISSUE_IDENTIFIED_BY)
        _optional_matter_ref(errors, f"{prefix}.linkedMatterId", issue.get("linkedMatterId"), valid_matter_ids)
        for field in ("additionalFee", "penalty"):
            _optional_decimal(errors, f"{prefix}.{field}", issue.get(field))
        for field in ("continuing", "corrected", "showCauseNoticeExists", "officerInDefault"):
            _ynns(errors, f"{prefix}.{field}", issue.get(field))

    _check_unique_ids(errors, "statutoryDues", section.get("statutoryDues") or [], "statutoryDueId")
    for index, due in enumerate(section.get("statutoryDues") or []):
        if not isinstance(due, dict):
            continue
        prefix = f"statutoryDues[{index}]"
        _require_enum(errors, f"{prefix}.dueType", due.get("dueType"), STATUTORY_DUE_TYPE)
        _optional_matter_ref(errors, f"{prefix}.linkedTaxMatterId", due.get("linkedTaxMatterId"), valid_matter_ids)
        for field in ("amountDue", "amountPaid", "interest", "penalty"):
            _optional_decimal(errors, f"{prefix}.{field}", due.get(field))
        _ynns(errors, f"{prefix}.disputed", due.get("disputed"))

    if errors:
        raise ValidationError(errors)


def validate_creditors_penalties_developments(section: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    valid_matter_ids = matter_ids(full_payload)

    policy = section.get("materialCreditorPolicy") or {}
    for field in ("policyExists", "adopted"):
        _ynns(errors, f"materialCreditorPolicy.{field}", policy.get(field))
    _require_enum(
        errors,
        "materialCreditorPolicy.thresholdType",
        policy.get("thresholdType"),
        MATERIAL_CREDITOR_THRESHOLD_TYPE,
    )
    _optional_decimal(errors, "materialCreditorPolicy.percentage", policy.get("percentage"))
    _optional_decimal(errors, "materialCreditorPolicy.absoluteAmount", policy.get("absoluteAmount"))

    _check_unique_ids(errors, "materialCreditors", section.get("materialCreditors") or [], "creditorId")
    for index, creditor in enumerate(section.get("materialCreditors") or []):
        if not isinstance(creditor, dict):
            continue
        prefix = f"materialCreditors[{index}]"
        _optional_decimal(errors, f"{prefix}.amountOutstanding", creditor.get("amountOutstanding"))
        _optional_matter_ref(errors, f"{prefix}.linkedMatterId", creditor.get("linkedMatterId"), valid_matter_ids)
        for field in ("relatedPartyStatus", "msmeStatus", "disputed", "legalNotice"):
            _ynns(errors, f"{prefix}.{field}", creditor.get(field))

    aggregates = section.get("creditorAggregateInputs") or {}
    for field in (
        "msmeOutstandingAmount",
        "materialCreditorAmount",
        "otherCreditorAmount",
        "totalTradePayableReference",
        "linkedFinancialsTradePayables",
        "reconciliationDifference",
    ):
        _optional_decimal(errors, f"creditorAggregateInputs.{field}", aggregates.get(field))
    _require_enum(
        errors,
        "creditorAggregateInputs.reconciliationStatus",
        aggregates.get("reconciliationStatus"),
        RECONCILIATION_STATUS,
    )

    _check_unique_ids(errors, "historicalPenalties", section.get("historicalPenalties") or [], "penaltyId")
    for index, penalty in enumerate(section.get("historicalPenalties") or []):
        if not isinstance(penalty, dict):
            continue
        prefix = f"historicalPenalties[{index}]"
        _optional_decimal(errors, f"{prefix}.amount", penalty.get("amount"))
        _optional_matter_ref(errors, f"{prefix}.linkedMatterId", penalty.get("linkedMatterId"), valid_matter_ids)

    _check_unique_ids(
        errors,
        "materialDevelopments",
        section.get("materialDevelopments") or [],
        "developmentId",
    )
    for index, development in enumerate(section.get("materialDevelopments") or []):
        if not isinstance(development, dict):
            continue
        prefix = f"materialDevelopments[{index}]"
        _require_enum(errors, f"{prefix}.category", development.get("category"), MATERIAL_DEVELOPMENT_CATEGORY)
        _optional_decimal(errors, f"{prefix}.financialImpact", development.get("financialImpact"))
        _ynns(errors, f"{prefix}.potentialRiskFactorRequirement", development.get("potentialRiskFactorRequirement"))

    if errors:
        raise ValidationError(errors)


def validate_reconciliation_confirmations(section: dict[str, Any], full_payload: dict[str, Any]) -> None:
    del full_payload
    errors: dict[str, str] = {}

    for rec_field in (
        "groupEntitiesReconciliation",
        "managementGovernanceReconciliation",
        "financialsReconciliation",
        "bacReconciliation",
        "businessOperationsReconciliation",
        "objectsOfIssueReconciliation",
        "ipoSetupReconciliation",
    ):
        rec = section.get(rec_field) or {}
        _require_enum(errors, f"{rec_field}.reconciliationStatus", rec.get("reconciliationStatus"), RECONCILIATION_STATUS)

    financials = section.get("financialsReconciliation") or {}
    for field in (
        "litigationAggregateAmount",
        "financialsContingentLiabilities",
        "litigationDifference",
        "taxAggregateAmount",
        "financialsTaxDisputes",
        "taxDifference",
        "provisionsAmount",
        "financialsProvisions",
        "provisionsDifference",
        "creditorTotalsAmount",
        "financialsTradePayables",
        "creditorDifference",
    ):
        _optional_decimal(errors, f"financialsReconciliation.{field}", financials.get(field))

    _check_unique_ids(errors, "remediationActions", section.get("remediationActions") or [], "remediationActionId")
    for index, action in enumerate(section.get("remediationActions") or []):
        if not isinstance(action, dict):
            continue
        prefix = f"remediationActions[{index}]"
        _require_enum(errors, f"{prefix}.linkedRecordType", action.get("linkedRecordType"), REMEDIATION_LINKED_RECORD_TYPE)
        _require_enum(errors, f"{prefix}.priority", action.get("priority"), REMEDIATION_PRIORITY)
        _require_enum(errors, f"{prefix}.status", action.get("status"), REMEDIATION_STATUS)
        _ynns(errors, f"{prefix}.professionalSignOffRequired", action.get("professionalSignOffRequired"))

    confirmations = section.get("confirmations") or {}
    for key, _ in LAC_CONFIRMATION_FIELDS:
        _ynns(errors, f"confirmations.{key}", confirmations.get(key))

    if errors:
        raise ValidationError(errors)


VALIDATORS: dict[str, Callable[[dict[str, Any], dict[str, Any]], None]] = {
    "legal-universe-materiality-policy-and-party-mapping": validate_legal_universe,
    "litigation-and-proceedings-master": validate_litigation_master,
    "criminal-regulatory-tax-and-enforcement-readiness": validate_criminal_regulatory_tax,
    "government-regulatory-and-business-approvals-master": validate_approvals_master,
    "approval-conditions-facility-compliance-and-renewal-readiness": validate_approval_conditions,
    "corporate-statutory-and-operational-compliance-exceptions": validate_compliance_exceptions,
    "material-creditors-penalties-and-material-developments": validate_creditors_penalties_developments,
    "reconciliation-remediation-and-issuer-confirmations": validate_reconciliation_confirmations,
}
