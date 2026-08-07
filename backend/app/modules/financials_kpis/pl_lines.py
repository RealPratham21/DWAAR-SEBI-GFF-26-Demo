"""P&L derived total keys — mirrors frontend pl-lines.ts."""

PL_DERIVED_TOTAL_KEYS: dict[str, tuple[str, ...]] = {
    "totalIncome": (
        "revenueFromOperations",
        "otherIncome",
        "financeIncome",
        "governmentGrants",
        "foreignExchangeIncome",
        "gainOnDisposal",
    ),
    "totalExpenses": (
        "costOfMaterialsConsumed",
        "purchasesOfStockInTrade",
        "changesInInventory",
        "manufacturingDirectOperatingExpenses",
        "employeeBenefitExpenses",
        "contractLabour",
        "sellingAndDistributionExpenses",
        "technologyHostingExpenses",
        "rentAndLeaseExpense",
        "otherOperatingExpenses",
        "financeCosts",
        "depreciation",
        "amortisation",
        "impairment",
        "otherExpenses",
    ),
}
