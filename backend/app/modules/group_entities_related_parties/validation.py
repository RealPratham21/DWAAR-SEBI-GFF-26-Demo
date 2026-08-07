"""Draft-tolerant section validation for Group Entities & Related Parties."""

from __future__ import annotations

from typing import Any, Callable

from app.modules.group_entities_related_parties import decimal_utils as dm
from app.modules.group_entities_related_parties.constants import (
    AGREEMENT_TYPE,
    ARMS_LENGTH_STATUS,
    AUDIT_STATUS,
    CASH_NON_CASH,
    CLASSIFICATION_FRAMEWORK,
    CLASSIFICATION_READINESS_STATE,
    COMMON_PERSON_RELATIONSHIP_TYPE,
    CURRENT_HISTORICAL,
    DEPENDENCY_TYPE,
    ENTITY_CLASSIFICATION_BADGE,
    ENTITY_INFORMATION_STATUS,
    ENTITY_STATUS,
    ENTITY_TYPE,
    GROUP_ENTITIES_CONFIRMATION_FIELDS,
    ICDR_GROUP_COMPANY_STATE,
    ICDR_IDENTIFICATION_BASIS,
    INTEREST_BEARING,
    LINKED_PERSON_ROLE,
    LISTED_STATUS,
    MATERIALITY_METRIC_TYPE,
    MATERIAL_SUBSIDIARY_PURPOSE,
    OTHER_BUSINESS_INTEREST_TYPE,
    OWNERSHIP_RELATIONSHIP_TYPE,
    PROFESSIONAL_CONFIRMATION_STATUS,
    RECURRING_NON_RECURRING,
    REGULATORY_CLASSIFICATION_TYPE,
    RELATED_PARTY_CATEGORY,
    RELATED_PARTY_PARTY_TYPE,
    RELATIONSHIP_CHANGE_EVENT,
    RELATIONSHIP_SOURCE_TYPE,
    RPT_BALANCE_TYPE,
    RPT_TRANSACTION_TYPE,
    SECURED_UNSECURED,
    STANDALONE_CONSOLIDATED,
    THRESHOLD_TYPE,
    YES_NO_NOT_SURE,
)
from app.modules.group_entities_related_parties.entities import entity_ids, get_entities
from app.modules.group_entities_related_parties.references import (
    count_entity_references,
    count_related_party_references,
    format_entity_dependency_message,
)


class ValidationError(Exception):
    def __init__(self, field_errors: dict[str, str]) -> None:
        self.field_errors = field_errors
        super().__init__("validation failed")


def _require_enum(
    errors: dict[str, str],
    field: str,
    value: Any,
    allowed: frozenset[str],
) -> None:
    text = "" if value is None else str(value)
    if text not in allowed:
        errors[field] = "Select a valid option."


def _ynns(errors: dict[str, str], field: str, value: Any) -> None:
    _require_enum(errors, field, value if value is not None else "", YES_NO_NOT_SURE)


def _optional_decimal(errors: dict[str, str], field: str, value: Any) -> None:
    if value is None or str(value).strip() == "":
        return
    if dm.is_invalid(value):
        errors[field] = "Enter a valid decimal value."


def _check_unique_ids(errors: dict[str, str], field: str, items: list[Any]) -> None:
    if not isinstance(items, list):
        errors[field] = "Must be a list."
        return
    seen: set[str] = set()
    for index, item in enumerate(items):
        if not isinstance(item, dict):
            errors[f"{field}[{index}]"] = "Invalid record."
            continue
        item_id = str(item.get("id") or "").strip()
        if not item_id:
            errors[f"{field}[{index}].id"] = "Record id is required."
            continue
        if item_id in seen:
            errors[f"{field}[{index}].id"] = "Duplicate id within this collection."
        seen.add(item_id)


def _optional_entity_ref(
    errors: dict[str, str],
    field: str,
    value: Any,
    valid_ids: set[str],
) -> None:
    ref = str(value or "").strip()
    if not ref:
        return
    if ref not in valid_ids:
        errors[field] = "References an entity that does not exist in the Entity Master."


def _validate_entity_deletions(
    errors: dict[str, str],
    full_payload: dict[str, Any],
    new_entities: list[Any] | None,
) -> None:
    old_ids = entity_ids(full_payload)
    new_ids = {
        str(item.get("id"))
        for item in (new_entities or [])
        if isinstance(item, dict) and item.get("id")
    }
    merged = dict(full_payload)
    merged["groupStructureAndEntityMaster"] = {
        **(full_payload.get("groupStructureAndEntityMaster") or {}),
        "entities": new_entities or [],
    }
    for removed_id in old_ids - new_ids:
        deps = count_entity_references(merged, removed_id)
        if deps:
            errors["entities"] = format_entity_dependency_message(deps)


def _validate_related_party_deletions(
    errors: dict[str, str],
    full_payload: dict[str, Any],
    new_relationships: list[Any] | None,
) -> None:
    old_section = full_payload.get("relatedPartyUniverseAndClassification") or {}
    old_ids = {
        str(rp.get("id"))
        for rp in (old_section.get("relatedPartyRelationships") or [])
        if isinstance(rp, dict) and rp.get("id")
    }
    new_ids = {
        str(item.get("id"))
        for item in (new_relationships or [])
        if isinstance(item, dict) and item.get("id")
    }
    merged = dict(full_payload)
    merged["relatedPartyUniverseAndClassification"] = {
        **old_section,
        "relatedPartyRelationships": new_relationships or [],
    }
    for removed_id in old_ids - new_ids:
        if count_related_party_references(merged, removed_id) > 0:
            errors["relatedPartyRelationships"] = (
                "Cannot remove related-party relationship referenced by RPT transactions or balances."
            )


def validate_entity_master(section: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    snapshot = section.get("groupSnapshot") or {}
    for field in (
        "holdingParentCompanyExists",
        "ultimateHoldingCompanyExists",
        "subsidiariesExist",
        "stepDownSubsidiariesExist",
        "associatesExist",
        "jointVenturesExist",
        "foreignGroupEntitiesExist",
        "promoterGroupEntitiesExist",
        "otherCommonControlEntitiesExist",
        "historicalEntitiesRelevant",
    ):
        _ynns(errors, f"groupSnapshot.{field}", snapshot.get(field))

    entities = section.get("entities") or []
    _check_unique_ids(errors, "entities", entities)
    _validate_entity_deletions(errors, full_payload, entities)

    valid_badges = ENTITY_CLASSIFICATION_BADGE
    for index, entity in enumerate(entities):
        if not isinstance(entity, dict):
            continue
        prefix = f"entities[{index}]"
        _require_enum(errors, f"{prefix}.entityType", entity.get("entityType"), ENTITY_TYPE)
        _require_enum(errors, f"{prefix}.status", entity.get("status"), ENTITY_STATUS)
        listing = entity.get("listing") or {}
        _require_enum(errors, f"{prefix}.listing.listedStatus", listing.get("listedStatus"), LISTED_STATUS)
        _ynns(errors, f"{prefix}.listing.delistedStatus", listing.get("delistedStatus"))
        for badge_index, badge in enumerate(entity.get("classificationBadges") or []):
            if badge not in valid_badges:
                errors[f"{prefix}.classificationBadges[{badge_index}]"] = "Select a valid badge."

    if errors:
        raise ValidationError(errors)


def validate_ownership_mapping(section: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    valid_entity_ids = entity_ids(full_payload)
    for collection in (
        "ownershipRelationships",
        "contractualArrangements",
        "commonPersonRelationships",
    ):
        _check_unique_ids(errors, collection, section.get(collection) or [])

    for index, rel in enumerate(section.get("ownershipRelationships") or []):
        if not isinstance(rel, dict):
            continue
        prefix = f"ownershipRelationships[{index}]"
        _require_enum(errors, f"{prefix}.relationshipType", rel.get("relationshipType"), OWNERSHIP_RELATIONSHIP_TYPE)
        _require_enum(errors, f"{prefix}.currentHistorical", rel.get("currentHistorical"), CURRENT_HISTORICAL)
        _require_enum(
            errors,
            f"{prefix}.professionalConfirmationStatus",
            rel.get("professionalConfirmationStatus"),
            PROFESSIONAL_CONFIRMATION_STATUS,
        )
        _optional_entity_ref(errors, f"{prefix}.parentPartyEntityId", rel.get("parentPartyEntityId"), valid_entity_ids)
        _optional_entity_ref(errors, f"{prefix}.investeeEntityId", rel.get("investeeEntityId"), valid_entity_ids)
        for field in (
            "equityOwnershipPercent",
            "votingRightsPercent",
            "economicInterestPercent",
            "fullyDilutedInterestPercent",
            "effectiveIndirectInterestPercent",
        ):
            _optional_decimal(errors, f"{prefix}.{field}", rel.get(field))
        for field in (
            "rightToAppointRemoveBoard",
            "boardNominationRights",
            "vetoRights",
            "affirmativeVotingRights",
            "managementControlRights",
            "jointControlArrangement",
            "participationInBusinessDecisions",
        ):
            _ynns(errors, f"{prefix}.{field}", rel.get(field))

    for index, arrangement in enumerate(section.get("contractualArrangements") or []):
        if not isinstance(arrangement, dict):
            continue
        prefix = f"contractualArrangements[{index}]"
        _require_enum(errors, f"{prefix}.agreementType", arrangement.get("agreementType"), AGREEMENT_TYPE)
        for entity_index, entity_id in enumerate(arrangement.get("partyEntityIds") or []):
            _optional_entity_ref(
                errors,
                f"{prefix}.partyEntityIds[{entity_index}]",
                entity_id,
                valid_entity_ids,
            )

    for index, rel in enumerate(section.get("commonPersonRelationships") or []):
        if not isinstance(rel, dict):
            continue
        prefix = f"commonPersonRelationships[{index}]"
        _require_enum(errors, f"{prefix}.relationshipType", rel.get("relationshipType"), COMMON_PERSON_RELATIONSHIP_TYPE)
        _require_enum(errors, f"{prefix}.linkedPersonRole", rel.get("linkedPersonRole"), LINKED_PERSON_ROLE)
        for entity_index, entity_id in enumerate(rel.get("entityIds") or []):
            _optional_entity_ref(errors, f"{prefix}.entityIds[{entity_index}]", entity_id, valid_entity_ids)

    if errors:
        raise ValidationError(errors)


def validate_classification(section: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    valid_entity_ids = entity_ids(full_payload)
    for collection in (
        "entityClassifications",
        "materialityCriteria",
        "materialSubsidiaryPurposeRecords",
    ):
        _check_unique_ids(errors, collection, section.get(collection) or [])

    for index, record in enumerate(section.get("entityClassifications") or []):
        if not isinstance(record, dict):
            continue
        prefix = f"entityClassifications[{index}]"
        _require_enum(errors, f"{prefix}.classificationType", record.get("classificationType"), REGULATORY_CLASSIFICATION_TYPE)
        _require_enum(errors, f"{prefix}.currentHistorical", record.get("currentHistorical"), CURRENT_HISTORICAL)
        _require_enum(errors, f"{prefix}.readinessState", record.get("readinessState"), CLASSIFICATION_READINESS_STATE)
        _optional_entity_ref(errors, f"{prefix}.entityId", record.get("entityId"), valid_entity_ids)
        _optional_decimal(errors, f"{prefix}.ownershipPercent", record.get("ownershipPercent"))
        _optional_decimal(errors, f"{prefix}.votingPercent", record.get("votingPercent"))

    for index, determination in enumerate(section.get("icdrGroupCompanyDeterminations") or []):
        if not isinstance(determination, dict):
            continue
        prefix = f"icdrGroupCompanyDeterminations[{index}]"
        _optional_entity_ref(errors, f"{prefix}.entityId", determination.get("entityId"), valid_entity_ids)
        _require_enum(errors, f"{prefix}.classificationState", determination.get("classificationState"), ICDR_GROUP_COMPANY_STATE)
        _require_enum(errors, f"{prefix}.identificationBasis", determination.get("identificationBasis"), ICDR_IDENTIFICATION_BASIS)
        for field in (
            "isCompany",
            "isPromoter",
            "isCurrentSubsidiary",
            "rptsDuringRelevantPeriods",
            "includedInAccountingStandardRptDisclosures",
            "boardConsidersMaterial",
        ):
            _ynns(errors, f"{prefix}.{field}", determination.get(field))

    policy = section.get("materialityPolicy") or {}
    for field in ("policyExists", "adopted"):
        _ynns(errors, f"materialityPolicy.{field}", policy.get(field))

    for index, criterion in enumerate(section.get("materialityCriteria") or []):
        if not isinstance(criterion, dict):
            continue
        prefix = f"materialityCriteria[{index}]"
        _require_enum(errors, f"{prefix}.metricType", criterion.get("metricType"), MATERIALITY_METRIC_TYPE)
        _require_enum(errors, f"{prefix}.thresholdType", criterion.get("thresholdType"), THRESHOLD_TYPE)
        _require_enum(
            errors,
            f"{prefix}.standaloneConsolidatedBasis",
            criterion.get("standaloneConsolidatedBasis"),
            STANDALONE_CONSOLIDATED,
        )
        _optional_decimal(errors, f"{prefix}.thresholdValue", criterion.get("thresholdValue"))

    for index, record in enumerate(section.get("materialSubsidiaryPurposeRecords") or []):
        if not isinstance(record, dict):
            continue
        prefix = f"materialSubsidiaryPurposeRecords[{index}]"
        _optional_entity_ref(errors, f"{prefix}.entityId", record.get("entityId"), valid_entity_ids)
        _require_enum(errors, f"{prefix}.purpose", record.get("purpose"), MATERIAL_SUBSIDIARY_PURPOSE)

    if errors:
        raise ValidationError(errors)


def validate_related_party_universe(section: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    valid_entity_ids = entity_ids(full_payload)
    relationships = section.get("relatedPartyRelationships") or []
    _check_unique_ids(errors, "relatedPartyRelationships", relationships)
    _validate_related_party_deletions(errors, full_payload, relationships)

    for index, rp in enumerate(relationships):
        if not isinstance(rp, dict):
            continue
        prefix = f"relatedPartyRelationships[{index}]"
        _require_enum(errors, f"{prefix}.partyType", rp.get("partyType"), RELATED_PARTY_PARTY_TYPE)
        _require_enum(errors, f"{prefix}.relationshipCategory", rp.get("relationshipCategory"), RELATED_PARTY_CATEGORY)
        _require_enum(errors, f"{prefix}.linkedPersonRole", rp.get("linkedPersonRole"), LINKED_PERSON_ROLE)
        _require_enum(errors, f"{prefix}.relationshipSourceType", rp.get("relationshipSourceType"), RELATIONSHIP_SOURCE_TYPE)
        _optional_entity_ref(errors, f"{prefix}.linkedEntityId", rp.get("linkedEntityId"), valid_entity_ids)
        for fc_index, fc in enumerate(rp.get("frameworkClassifications") or []):
            if not isinstance(fc, dict):
                continue
            fc_prefix = f"{prefix}.frameworkClassifications[{fc_index}]"
            _require_enum(errors, f"{fc_prefix}.framework", fc.get("framework"), CLASSIFICATION_FRAMEWORK)
            _ynns(errors, f"{fc_prefix}.related", fc.get("related"))
            _require_enum(errors, f"{fc_prefix}.currentHistorical", fc.get("currentHistorical"), CURRENT_HISTORICAL)

    if errors:
        raise ValidationError(errors)


def _related_party_ids(full_payload: dict[str, Any]) -> set[str]:
    section = full_payload.get("relatedPartyUniverseAndClassification") or {}
    return {
        str(rp.get("id"))
        for rp in (section.get("relatedPartyRelationships") or [])
        if isinstance(rp, dict) and rp.get("id")
    }


def validate_rpt_section(section: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    valid_entity_ids = entity_ids(full_payload)
    valid_rp_ids = _related_party_ids(full_payload)
    _check_unique_ids(errors, "transactions", section.get("transactions") or [])
    _check_unique_ids(errors, "balances", section.get("balances") or [])

    for index, tx in enumerate(section.get("transactions") or []):
        if not isinstance(tx, dict):
            continue
        prefix = f"transactions[{index}]"
        _require_enum(errors, f"{prefix}.transactionType", tx.get("transactionType"), RPT_TRANSACTION_TYPE)
        _require_enum(errors, f"{prefix}.armsLengthStatus", tx.get("armsLengthStatus"), ARMS_LENGTH_STATUS)
        _require_enum(errors, f"{prefix}.recurringNonRecurring", tx.get("recurringNonRecurring"), RECURRING_NON_RECURRING)
        _require_enum(errors, f"{prefix}.cashNonCash", tx.get("cashNonCash"), CASH_NON_CASH)
        _optional_decimal(errors, f"{prefix}.transactionValue", tx.get("transactionValue"))
        _optional_entity_ref(errors, f"{prefix}.linkedEntityId", tx.get("linkedEntityId"), valid_entity_ids)
        rp_ref = str(tx.get("relatedPartyRelationshipId") or "").strip()
        if rp_ref and rp_ref not in valid_rp_ids:
            errors[f"{prefix}.relatedPartyRelationshipId"] = (
                "References a related-party relationship that does not exist."
            )

    for index, balance in enumerate(section.get("balances") or []):
        if not isinstance(balance, dict):
            continue
        prefix = f"balances[{index}]"
        _require_enum(errors, f"{prefix}.balanceType", balance.get("balanceType"), RPT_BALANCE_TYPE)
        _require_enum(errors, f"{prefix}.securedUnsecured", balance.get("securedUnsecured"), SECURED_UNSECURED)
        _require_enum(errors, f"{prefix}.interestBearing", balance.get("interestBearing"), INTEREST_BEARING)
        for field in (
            "openingBalance",
            "transactionsDuringPeriod",
            "settlements",
            "closingBalance",
            "interestRate",
            "doubtfulAmountProvision",
            "writtenOffAmount",
            "writtenBackAmount",
        ):
            _optional_decimal(errors, f"{prefix}.{field}", balance.get(field))
        _optional_entity_ref(errors, f"{prefix}.linkedEntityId", balance.get("linkedEntityId"), valid_entity_ids)
        rp_ref = str(balance.get("relatedPartyRelationshipId") or "").strip()
        if rp_ref and rp_ref not in valid_rp_ids:
            errors[f"{prefix}.relatedPartyRelationshipId"] = (
                "References a related-party relationship that does not exist."
            )

    if errors:
        raise ValidationError(errors)


def validate_common_pursuits(section: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    valid_entity_ids = entity_ids(full_payload)
    for collection in (
        "commonPursuitRecords",
        "interCompanyDependencies",
        "otherBusinessInterests",
    ):
        _check_unique_ids(errors, collection, section.get(collection) or [])

    for index, screening in enumerate(section.get("commonPursuitScreenings") or []):
        if not isinstance(screening, dict):
            continue
        prefix = f"commonPursuitScreenings[{index}]"
        _optional_entity_ref(errors, f"{prefix}.entityId", screening.get("entityId"), valid_entity_ids)
        for field in (
            "sameLineOfBusiness",
            "constitutionalObjectsPermitSameBusiness",
            "overlappingProductsServices",
            "sameCustomerSegment",
            "sameGeography",
            "sameSuppliers",
            "sameTenderBiddingOpportunities",
            "sameDistributionChannels",
            "sameTechnologyIp",
            "sameBrand",
            "sharedEmployeesResources",
            "sharedPromotersManagement",
        ):
            _ynns(errors, f"{prefix}.{field}", screening.get(field))

    for index, record in enumerate(section.get("commonPursuitRecords") or []):
        if not isinstance(record, dict):
            continue
        prefix = f"commonPursuitRecords[{index}]"
        _optional_entity_ref(errors, f"{prefix}.entityId", record.get("entityId"), valid_entity_ids)
        _optional_decimal(errors, f"{prefix}.existingRevenueFromOverlappingBusiness", record.get("existingRevenueFromOverlappingBusiness"))

    for index, dep in enumerate(section.get("interCompanyDependencies") or []):
        if not isinstance(dep, dict):
            continue
        prefix = f"interCompanyDependencies[{index}]"
        _require_enum(errors, f"{prefix}.dependencyType", dep.get("dependencyType"), DEPENDENCY_TYPE)
        _optional_entity_ref(errors, f"{prefix}.entityId", dep.get("entityId"), valid_entity_ids)
        _optional_decimal(errors, f"{prefix}.annualTransactionValue", dep.get("annualTransactionValue"))
        _optional_decimal(
            errors,
            f"{prefix}.percentageOfIssuerRevenuePurchasesCost",
            dep.get("percentageOfIssuerRevenuePurchasesCost"),
        )

    for index, interest in enumerate(section.get("otherBusinessInterests") or []):
        if not isinstance(interest, dict):
            continue
        prefix = f"otherBusinessInterests[{index}]"
        _require_enum(errors, f"{prefix}.interestType", interest.get("interestType"), OTHER_BUSINESS_INTEREST_TYPE)
        _optional_entity_ref(errors, f"{prefix}.entityId", interest.get("entityId"), valid_entity_ids)
        _optional_decimal(errors, f"{prefix}.value", interest.get("value"))

    if errors:
        raise ValidationError(errors)


def validate_financial_readiness(section: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    valid_entity_ids = entity_ids(full_payload)
    records = section.get("entityFinancialReadiness") or []
    _check_unique_ids(errors, "entityFinancialReadiness", records)

    for index, record in enumerate(records):
        if not isinstance(record, dict):
            continue
        prefix = f"entityFinancialReadiness[{index}]"
        _optional_entity_ref(errors, f"{prefix}.entityId", record.get("entityId"), valid_entity_ids)
        _require_enum(errors, f"{prefix}.auditStatus", record.get("auditStatus"), AUDIT_STATUS)
        _require_enum(errors, f"{prefix}.informationStatus", record.get("informationStatus"), ENTITY_INFORMATION_STATUS)
        _optional_decimal(errors, f"{prefix}.litigationAggregateAmount", record.get("litigationAggregateAmount"))
        for summary_index, summary in enumerate(record.get("financialPeriodSummaries") or []):
            if not isinstance(summary, dict):
                continue
            summary_prefix = f"{prefix}.financialPeriodSummaries[{summary_index}]"
            for field in (
                "equityShareCapital",
                "reservesOtherEquity",
                "netWorth",
                "revenueTurnover",
                "totalIncome",
                "profitLossAfterTax",
                "eps",
                "totalBorrowings",
            ):
                _optional_decimal(errors, f"{summary_prefix}.{field}", summary.get(field))

    if errors:
        raise ValidationError(errors)


def validate_changes_confirmations(section: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    valid_entity_ids = entity_ids(full_payload)
    _check_unique_ids(errors, "relationshipChanges", section.get("relationshipChanges") or [])

    for index, change in enumerate(section.get("relationshipChanges") or []):
        if not isinstance(change, dict):
            continue
        prefix = f"relationshipChanges[{index}]"
        _require_enum(errors, f"{prefix}.eventType", change.get("eventType"), RELATIONSHIP_CHANGE_EVENT)
        _optional_entity_ref(errors, f"{prefix}.entityId", change.get("entityId"), valid_entity_ids)

    review = section.get("groupCompanyClassificationReview") or {}
    for field in (
        "allRptEntitiesReviewed",
        "subsidiariesHandledSeparately",
        "promotersHandledSeparately",
        "boardMaterialEntitiesConsidered",
        "materialityPolicyApplied",
        "boardFinalListApproved",
    ):
        _ynns(errors, f"groupCompanyClassificationReview.{field}", review.get(field))

    rpt_readiness = section.get("rptReadiness") or {}
    for field in (
        "completeRptScheduleAvailable",
        "reconciledWithRestatedFinancialInformation",
        "outstandingBalancesReconciled",
        "commitmentsIncluded",
        "guaranteesSecurityIncluded",
        "nonCashTransactionsIncluded",
        "kmpCompensationIncluded",
        "historicalRelatedPartiesIncluded",
        "approvalsMapped",
        "pendingAuditCommitteeAction",
        "pendingBoardAction",
        "pendingShareholderAction",
    ):
        _ynns(errors, f"rptReadiness.{field}", rpt_readiness.get(field))

    confirmations = section.get("confirmations") or {}
    for key, _ in GROUP_ENTITIES_CONFIRMATION_FIELDS:
        _ynns(errors, f"confirmations.{key}", confirmations.get(key))

    if errors:
        raise ValidationError(errors)


VALIDATORS: dict[str, Callable[[dict[str, Any], dict[str, Any]], None]] = {
    "group-structure-and-entity-master": validate_entity_master,
    "ownership-control-and-relationship-mapping": validate_ownership_mapping,
    "group-company-and-materiality-classification": validate_classification,
    "related-party-universe-and-classification": validate_related_party_universe,
    "related-party-transactions-balances-and-commitments": validate_rpt_section,
    "common-pursuits-dependencies-and-conflicts": validate_common_pursuits,
    "group-entity-financial-regulatory-and-litigation-readiness": validate_financial_readiness,
    "changes-rpt-readiness-and-confirmations": validate_changes_confirmations,
}
