"""Derived Business & Operations computations — ports `frontend/lib/business-operations/compute.ts`.

Nothing here is persisted. Every result is recomputed from the payload using Decimal-safe
string arithmetic.
"""

from __future__ import annotations

from typing import Any

from app.modules.business_operations import decimal_math as dm

PERCENT_RECONCILE_TOLERANCE = "2"


def _percentage_variance_from_100(total_percentage: str) -> str:
    return dm.difference(total_percentage, "100")


def _reconciles_to_100(total_percentage: str) -> bool:
    if not dm.is_filled(total_percentage):
        return False
    variance = dm.abs_decimal(_percentage_variance_from_100(total_percentage))
    if not dm.is_filled(variance):
        return False
    cmp = dm.compare(variance, PERCENT_RECONCILE_TOLERANCE)
    return cmp is not None and cmp <= 0


def _compute_revenue_mix(payload: dict[str, Any]) -> dict[str, Any]:
    rows = payload["productsServicesAndRevenueMix"]["revenueMixRows"]
    years: dict[str, list[dict[str, Any]]] = {}
    for row in rows:
        year = (row.get("financialYear") or "").strip() or "(unspecified)"
        years.setdefault(year, []).append(row)

    by_year: list[dict[str, Any]] = []
    largest: dict[str, Any] | None = None

    for financial_year, year_rows in years.items():
        total_revenue = dm.sum_decimals([row.get("revenue") for row in year_rows])
        total_percentage = dm.sum_decimals(
            [row.get("percentageOfRevenueFromOperations") for row in year_rows]
        )
        percentages_reconcile = _reconciles_to_100(total_percentage)
        by_year.append(
            {
                "financialYear": financial_year,
                "totalRevenue": total_revenue,
                "totalPercentage": total_percentage,
                "rowCount": len(year_rows),
                "percentagesReconcile": percentages_reconcile,
                "varianceFrom100": _percentage_variance_from_100(total_percentage),
            }
        )

        for row in year_rows:
            percentage = dm.to_decimal_string(row.get("percentageOfRevenueFromOperations"))
            revenue = dm.to_decimal_string(row.get("revenue"))
            label = row.get("productOrSegmentLabel") or row.get("productOrSegmentId") or "Unnamed segment"
            if largest is None:
                if dm.is_filled(percentage) or dm.is_filled(revenue):
                    largest = {
                        "label": label,
                        "financialYear": financial_year,
                        "revenue": revenue,
                        "percentage": percentage,
                    }
                continue
            if dm.is_filled(percentage) and (
                not dm.is_filled(largest["percentage"])
                or dm.greater_than(percentage, largest["percentage"])
            ):
                largest = {
                    "label": label,
                    "financialYear": financial_year,
                    "revenue": revenue,
                    "percentage": percentage,
                }
            elif (
                not dm.is_filled(percentage)
                and dm.is_filled(revenue)
                and (not dm.is_filled(largest["revenue"]) or dm.greater_than(revenue, largest["revenue"]))
            ):
                largest = {
                    "label": label,
                    "financialYear": financial_year,
                    "revenue": revenue,
                    "percentage": percentage,
                }

    by_year.sort(key=lambda entry: entry["financialYear"])

    product_ids_with_revenue = {
        row.get("productOrSegmentId") or row.get("productOrSegmentLabel")
        for row in rows
        if dm.is_filled(row.get("revenue")) or dm.is_filled(row.get("percentageOfRevenueFromOperations"))
    }

    return {
        "byYear": by_year,
        "largest": largest,
        "productConcentration": {
            "largestProductPercentage": (largest or {}).get("percentage", ""),
            "productCountWithRevenue": len(product_ids_with_revenue),
        },
        "allReconcile": len(by_year) > 0 and all(year["percentagesReconcile"] for year in by_year),
    }


def _compute_customer_concentration(payload: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        {
            "periodLabel": row.get("periodLabel", ""),
            "isCurrentPeriod": bool(row.get("isCurrentPeriod")),
            "largestPercentage": dm.to_decimal_string(row.get("largestCustomerPercentage")),
            "top3Percentage": dm.to_decimal_string(row.get("top3Percentage")),
            "top5Percentage": dm.to_decimal_string(row.get("top5Percentage")),
            "top10Percentage": dm.to_decimal_string(row.get("top10Percentage")),
            "total": dm.to_decimal_string(row.get("totalRevenueFromOperations")),
        }
        for row in payload["customersSalesDistributionAndGeography"]["customerConcentrationPeriods"]
    ]


def _compute_supplier_concentration(payload: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        {
            "periodLabel": row.get("periodLabel", ""),
            "isCurrentPeriod": bool(row.get("isCurrentPeriod")),
            "largestPercentage": dm.to_decimal_string(row.get("largestSupplierPercentage")),
            "top3Percentage": dm.to_decimal_string(row.get("top3Percentage")),
            "top5Percentage": dm.to_decimal_string(row.get("top5Percentage")),
            "top10Percentage": dm.to_decimal_string(row.get("top10Percentage")),
            "total": dm.to_decimal_string(row.get("totalPurchases")),
        }
        for row in payload["suppliersProcurementInventoryAndLogistics"]["supplierConcentrationPeriods"]
    ]


def _compute_geographic_mix(payload: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        {
            "periodLabel": row.get("periodLabel", ""),
            "geographicScope": row.get("geographicScope", ""),
            "regionOrCountry": row.get("regionOrCountry", ""),
            "revenue": dm.to_decimal_string(row.get("revenue")),
            "percentage": dm.to_decimal_string(row.get("percentageOfRevenue")),
        }
        for row in payload["customersSalesDistributionAndGeography"]["geographicRevenueRows"]
    ]


def _compute_capacity_utilisation(payload: dict[str, Any]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for row in payload["facilitiesCapacityAndOperationalProcess"]["capacityRecords"]:
        base = row.get("availableCapacity") if dm.is_positive(row.get("availableCapacity")) else row.get(
            "installedCapacity"
        )
        raw = dm.pct(row.get("actualOutput"), base, 4)
        exceeds_100 = dm.is_filled(raw) and dm.greater_than(raw, "100")
        utilisation_percentage = "100" if exceeds_100 else (dm.round_decimal(raw, 2) if dm.is_filled(raw) else "")
        rows.append(
            {
                "id": row.get("id", ""),
                "facilityId": row.get("facilityId", ""),
                "facilityName": row.get("facilityName", ""),
                "periodLabel": row.get("periodLabel", ""),
                "isCurrentPeriod": bool(row.get("isCurrentPeriod")),
                "metricOrCapacityUnit": row.get("metricOrCapacityUnit", ""),
                "installedCapacity": dm.to_decimal_string(row.get("installedCapacity")),
                "availableCapacity": dm.to_decimal_string(row.get("availableCapacity")),
                "actualOutput": dm.to_decimal_string(row.get("actualOutput")),
                "utilisationPercentage": utilisation_percentage,
                "rawUtilisationPercentage": dm.round_decimal(raw, 2) if dm.is_filled(raw) else "",
                "exceeds100": exceeds_100,
                "explanationProvided": bool((row.get("utilisationAbove100Explanation") or "").strip()),
            }
        )
    return rows


def _compute_workforce_latest(payload: dict[str, Any]) -> dict[str, Any] | None:
    periods = payload["workforceCollaborationsInsuranceAndContinuity"]["workforcePeriods"]
    if not periods:
        return None
    current = next((row for row in periods if row.get("isCurrentPeriod")), periods[-1])
    if current is None:
        return None
    total_headcount = dm.sum_decimals([current.get("permanentEmployees"), current.get("contractWorkers")])
    return {
        "asOfDate": current.get("asOfDate", ""),
        "periodLabel": current.get("periodLabel", ""),
        "permanentEmployees": dm.to_decimal_string(current.get("permanentEmployees")),
        "contractWorkers": dm.to_decimal_string(current.get("contractWorkers")),
        "totalHeadcount": total_headcount,
        "womenEmployees": dm.to_decimal_string(current.get("womenEmployees")),
        "attritionPercentage": dm.to_decimal_string(current.get("attritionPercentage")),
    }


def _reconcile_business_operations(
    payload: dict[str, Any],
    *,
    revenue_mix_by_year: list[dict[str, Any]],
    revenue_percentages_reconcile: bool,
    capacity_utilisation: list[dict[str, Any]],
    geographic_mix: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    checks: list[dict[str, Any]] = []
    profile = payload["businessProfileAndOperatingModel"]
    products = payload["productsServicesAndRevenueMix"]
    customers = payload["customersSalesDistributionAndGeography"]
    suppliers = payload["suppliersProcurementInventoryAndLogistics"]
    facilities = payload["facilitiesCapacityAndOperationalProcess"]
    strategy = payload["competitiveStrengthsStrategyDependenciesAndConfirmations"]

    if not (profile.get("primaryBusinessActivity") or "").strip() or not profile.get("revenueModels"):
        checks.append(
            {
                "id": "primary-activity-revenue-model",
                "label": "Primary activity and revenue model captured",
                "status": "missing_information",
                "message": "Primary business activity or revenue model has not been captured.",
            }
        )
    else:
        checks.append(
            {
                "id": "primary-activity-revenue-model",
                "label": "Primary activity and revenue model captured",
                "status": "reconciled",
                "message": "Primary activity and at least one revenue model are recorded.",
            }
        )

    if len(revenue_mix_by_year) == 0:
        checks.append(
            {
                "id": "revenue-mix-reconcile",
                "label": "Revenue percentages reconcile by year",
                "status": "missing_information",
                "message": "No revenue-mix rows have been entered yet.",
            }
        )
    elif revenue_percentages_reconcile:
        checks.append(
            {
                "id": "revenue-mix-reconcile",
                "label": "Revenue percentages reconcile by year",
                "status": "reconciled",
                "message": "Revenue-mix percentages total approximately 100% for each year entered.",
            }
        )
    else:
        checks.append(
            {
                "id": "revenue-mix-reconcile",
                "label": "Revenue percentages reconcile by year",
                "status": "variance",
                "message": "One or more years have revenue-mix percentages that do not total near 100%.",
            }
        )

    if len(products["productsServices"]) == 0:
        checks.append(
            {
                "id": "material-products-represented",
                "label": "Material products are represented",
                "status": "missing_information",
                "message": "No products or services have been recorded.",
            }
        )
    else:
        checks.append(
            {
                "id": "material-products-represented",
                "label": "Material products are represented",
                "status": "reconciled",
                "message": f"{len(products['productsServices'])} product/service record(s) captured.",
            }
        )

    if len(customers["customerConcentrationPeriods"]) == 0:
        checks.append(
            {
                "id": "customer-concentration",
                "label": "Customer concentration is provided",
                "status": "missing_information",
                "message": "Customer concentration by period has not been provided.",
            }
        )
    else:
        checks.append(
            {
                "id": "customer-concentration",
                "label": "Customer concentration is provided",
                "status": "reconciled",
                "message": f"{len(customers['customerConcentrationPeriods'])} customer concentration period(s) recorded.",
            }
        )

    if len(suppliers["supplierConcentrationPeriods"]) == 0:
        checks.append(
            {
                "id": "supplier-concentration",
                "label": "Supplier concentration is provided",
                "status": "missing_information",
                "message": "Supplier concentration by period has not been provided.",
            }
        )
    else:
        checks.append(
            {
                "id": "supplier-concentration",
                "label": "Supplier concentration is provided",
                "status": "reconciled",
                "message": f"{len(suppliers['supplierConcentrationPeriods'])} supplier concentration period(s) recorded.",
            }
        )

    if len(geographic_mix) == 0:
        checks.append(
            {
                "id": "geographic-revenue",
                "label": "Geographic revenue mix is provided",
                "status": "missing_information",
                "message": "Geographic revenue rows have not been entered.",
            }
        )
    else:
        periods: dict[str, list[str]] = {}
        for row in geographic_mix:
            periods.setdefault(row["periodLabel"], []).append(row["percentage"])
        geo_ok = True
        any_percentage = False
        for percentages in periods.values():
            total = dm.sum_decimals(percentages)
            if dm.is_filled(total):
                any_percentage = True
                if not _reconciles_to_100(total):
                    geo_ok = False
        checks.append(
            {
                "id": "geographic-revenue",
                "label": "Geographic revenue reconciles",
                "status": (
                    "missing_information" if not any_percentage else ("reconciled" if geo_ok else "variance")
                ),
                "message": (
                    "Geographic revenue percentages are incomplete."
                    if not any_percentage
                    else (
                        "Geographic revenue percentages total approximately 100% by period."
                        if geo_ok
                        else "Geographic revenue percentages do not reconcile to 100% for one or more periods."
                    )
                ),
            }
        )

    if customers.get("orderBookAvailable") == "yes":
        if dm.is_filled(customers.get("orderBookValue")) and customers.get("orderBookSourceStatus") in (
            "available",
            "pending",
        ):
            checks.append(
                {
                    "id": "order-book-source",
                    "label": "Order-book values have a source",
                    "status": (
                        "reconciled"
                        if customers.get("orderBookSourceStatus") == "available"
                        else "missing_information"
                    ),
                    "message": (
                        "Order-book value is recorded with an available source."
                        if customers.get("orderBookSourceStatus") == "available"
                        else "Order-book value is recorded but the source is still pending."
                    ),
                }
            )
        else:
            checks.append(
                {
                    "id": "order-book-source",
                    "label": "Order-book values have a source",
                    "status": "missing_information",
                    "message": "Order book is marked available but value or source status is incomplete.",
                }
            )
    elif customers.get("orderBookAvailable") == "no":
        checks.append(
            {
                "id": "order-book-source",
                "label": "Order-book values have a source",
                "status": "not_applicable",
                "message": "No order book is reported.",
            }
        )
    else:
        checks.append(
            {
                "id": "order-book-source",
                "label": "Order-book values have a source",
                "status": "missing_information",
                "message": "Whether an order book is available has not been answered.",
            }
        )

    if len(facilities["facilities"]) == 0:
        checks.append(
            {
                "id": "facilities-recorded",
                "label": "Facilities are recorded",
                "status": "missing_information",
                "message": "No facilities have been recorded.",
            }
        )
    else:
        checks.append(
            {
                "id": "facilities-recorded",
                "label": "Facilities are recorded",
                "status": "reconciled",
                "message": f"{len(facilities['facilities'])} facility record(s) captured.",
            }
        )

    over_utilised = [row for row in capacity_utilisation if row["exceeds100"]]
    if len(capacity_utilisation) == 0:
        checks.append(
            {
                "id": "capacity-utilisation",
                "label": "Utilisation is not above 100% without explanation",
                "status": "missing_information",
                "message": "No capacity records have been entered.",
            }
        )
    elif any(not row["explanationProvided"] for row in over_utilised):
        unexplained = len([row for row in over_utilised if not row["explanationProvided"]])
        checks.append(
            {
                "id": "capacity-utilisation",
                "label": "Utilisation is not above 100% without explanation",
                "status": "variance",
                "message": f"{unexplained} capacity row(s) exceed 100% utilisation without explanation.",
            }
        )
    else:
        checks.append(
            {
                "id": "capacity-utilisation",
                "label": "Utilisation is not above 100% without explanation",
                "status": "reconciled",
                "message": (
                    "Utilisation above 100% is explained where reported."
                    if len(over_utilised) > 0
                    else "No capacity row exceeds 100% utilisation."
                ),
            }
        )

    strengths_without_source = [
        item
        for item in strategy["competitiveStrengths"]
        if (item.get("title") or "").strip() and not (item.get("supportingSource") or "").strip()
    ]
    if len(strategy["competitiveStrengths"]) == 0:
        checks.append(
            {
                "id": "strength-sources",
                "label": "Strengths have supporting sources",
                "status": "missing_information",
                "message": "No competitive strengths have been recorded.",
            }
        )
    elif len(strengths_without_source) > 0:
        checks.append(
            {
                "id": "strength-sources",
                "label": "Strengths have supporting sources",
                "status": "variance",
                "message": f"{len(strengths_without_source)} strength claim(s) lack a supporting source.",
            }
        )
    else:
        checks.append(
            {
                "id": "strength-sources",
                "label": "Strengths have supporting sources",
                "status": "reconciled",
                "message": "Recorded strength claims include supporting sources.",
            }
        )

    strategies_with_projections = [
        item for item in strategy["strategies"] if item.get("containsUnsupportedProjections") == "yes"
    ]
    if len(strategy["strategies"]) == 0:
        checks.append(
            {
                "id": "strategy-projections",
                "label": "Strategies avoid unsupported projections",
                "status": "missing_information",
                "message": "No strategies have been recorded.",
            }
        )
    elif len(strategies_with_projections) > 0:
        checks.append(
            {
                "id": "strategy-projections",
                "label": "Strategies avoid unsupported projections",
                "status": "variance",
                "message": f"{len(strategies_with_projections)} strateg(y/ies) are flagged as containing unsupported projections.",
            }
        )
    else:
        checks.append(
            {
                "id": "strategy-projections",
                "label": "Strategies avoid unsupported projections",
                "status": "reconciled",
                "message": "Recorded strategies are not flagged for unsupported projections.",
            }
        )

    return checks


def compute_business_operations_model(payload: dict[str, Any]) -> dict[str, Any]:
    """Single entry point used by the Overview, Information and Business Assessment views."""
    mix = _compute_revenue_mix(payload)
    customer_concentration = _compute_customer_concentration(payload)
    supplier_concentration = _compute_supplier_concentration(payload)
    geographic_mix = _compute_geographic_mix(payload)
    capacity_utilisation = _compute_capacity_utilisation(payload)
    workforce_latest = _compute_workforce_latest(payload)

    tech = payload["technologyQualityResearchAndIntellectualProperty"]
    strategy = payload["competitiveStrengthsStrategyDependenciesAndConfirmations"]
    workforce = payload["workforceCollaborationsInsuranceAndContinuity"]

    counts = {
        "products": len(payload["productsServicesAndRevenueMix"]["productsServices"]),
        "facilities": len(payload["facilitiesCapacityAndOperationalProcess"]["facilities"]),
        "certifications": len(tech["certifications"]),
        "ipRecords": len(tech["intellectualPropertyRecords"]),
        "strengths": len(strategy["competitiveStrengths"]),
        "strategies": len(strategy["strategies"]),
        "dependencies": len(strategy["keyDependencies"]) + len(workforce["operatingDependencies"]),
        "businessUnits": len(payload["businessProfileAndOperatingModel"]["businessUnits"]),
        "materialCustomers": len(payload["customersSalesDistributionAndGeography"]["materialCustomers"]),
        "materialSuppliers": len(payload["suppliersProcurementInventoryAndLogistics"]["materialSuppliers"]),
    }

    reconciliation = _reconcile_business_operations(
        payload,
        revenue_mix_by_year=mix["byYear"],
        revenue_percentages_reconcile=mix["allReconcile"],
        capacity_utilisation=capacity_utilisation,
        geographic_mix=geographic_mix,
    )

    return {
        "revenueMixByYear": mix["byYear"],
        "largestSegment": mix["largest"],
        "productConcentration": mix["productConcentration"],
        "revenuePercentagesReconcile": mix["allReconcile"],
        "customerConcentration": customer_concentration,
        "supplierConcentration": supplier_concentration,
        "geographicMix": geographic_mix,
        "capacityUtilisation": capacity_utilisation,
        "workforceLatest": workforce_latest,
        "counts": counts,
        "reconciliation": reconciliation,
    }
