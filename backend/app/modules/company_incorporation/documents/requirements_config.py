from dataclasses import dataclass
from typing import Literal

RequirementLevel = Literal["mandatory", "conditional"]

MULTI_DOCUMENT_REQUIREMENT_KEYS: frozenset[str] = frozenset(
    {
        "moa-amendment-resolutions-filings",
        "aoa-amendment-resolutions-filings",
        "board-resolutions",
        "shareholder-resolutions",
        "mgt-14-or-equivalent",
        "merger-demerger-nclt-orders",
        "business-transfer-succession",
        "gst-registration-certificates",
        "registration-amendment-evidence",
    },
)

ONBOARDING_TO_REQUIREMENT_KEY: dict[str, str] = {
    "certificate-of-incorporation": "original-certificate-of-incorporation",
    "current-moa": "current-certified-moa",
    "current-aoa": "current-certified-aoa",
    "pan": "pan-certificate",
}


@dataclass(frozen=True, slots=True)
class DocumentRequirementDefinition:
    key: str
    name: str
    requirement_level: RequirementLevel
    explanation: str
    group_id: str
    group_title: str
    allow_multiple: bool


DOCUMENT_REQUIREMENT_GROUPS: tuple[
    tuple[str, str, tuple[tuple[str, str, RequirementLevel, str], ...]], ...
] = (
    (
        "incorporation-documents",
        "Incorporation Documents",
        (
            (
                "original-certificate-of-incorporation",
                "Original Certificate of Incorporation",
                "mandatory",
                "Certificate issued on original incorporation of the company.",
            ),
            (
                "fresh-certificate-after-name-change",
                "Fresh Certificate of Incorporation after name change",
                "conditional",
                "Required where the company name has changed since incorporation.",
            ),
            (
                "public-company-conversion-certificate",
                "Public-company conversion certificate",
                "conditional",
                "Required where the company converted from private to public status.",
            ),
            (
                "commencement-of-business-evidence",
                "Commencement of business evidence, where applicable",
                "conditional",
                "Evidence of commencement of business where required under applicable law.",
            ),
        ),
    ),
    (
        "constitutional-documents",
        "Constitutional Documents",
        (
            (
                "current-certified-moa",
                "Current certified Memorandum of Association",
                "mandatory",
                "Latest certified copy of the MoA in force.",
            ),
            (
                "current-certified-aoa",
                "Current certified Articles of Association",
                "mandatory",
                "Latest certified copy of the AoA in force.",
            ),
            (
                "moa-amendment-resolutions-filings",
                "MoA amendment resolutions and filings",
                "conditional",
                "Supporting records for each material MoA amendment.",
            ),
            (
                "aoa-amendment-resolutions-filings",
                "AoA amendment resolutions and filings",
                "conditional",
                "Supporting records for each material AoA amendment.",
            ),
        ),
    ),
    (
        "registered-office-documents",
        "Registered Office Documents",
        (
            (
                "current-registered-office-filing",
                "Current registered-office filing",
                "mandatory",
                "Filing evidencing the current registered office of the company.",
            ),
            (
                "filing-acknowledgement-or-srn",
                "Filing acknowledgement or SRN",
                "mandatory",
                "Acknowledgement or service request number for the registered-office filing.",
            ),
            (
                "registered-office-address-proof",
                "Registered-office address proof",
                "mandatory",
                "Documentary proof of the registered-office address.",
            ),
            (
                "board-resolution-office-change",
                "Board resolution for office change",
                "conditional",
                "Required where the registered office has changed.",
            ),
            (
                "roc-or-rd-approval",
                "RoC or Regional Director approval, where applicable",
                "conditional",
                "Required where inter-state or other approval is needed for office change.",
            ),
        ),
    ),
    (
        "corporate-event-documents",
        "Corporate Event Documents",
        (
            (
                "board-resolutions",
                "Board resolutions",
                "conditional",
                "Board resolutions supporting recorded corporate events.",
            ),
            (
                "shareholder-resolutions",
                "Shareholder resolutions",
                "conditional",
                "Shareholder resolutions supporting recorded corporate events.",
            ),
            (
                "mgt-14-or-equivalent",
                "MGT-14 or equivalent filings",
                "conditional",
                "Statutory filings for resolutions requiring RoC intimation.",
            ),
            (
                "merger-demerger-nclt-orders",
                "Merger, demerger, or NCLT orders",
                "conditional",
                "Court or tribunal orders for restructuring events.",
            ),
            (
                "business-transfer-succession",
                "Business transfer or succession documents",
                "conditional",
                "Documents evidencing acquisition, transfer, or succession of undertaking.",
            ),
        ),
    ),
    (
        "core-registration-documents",
        "Core Registration Documents",
        (
            (
                "pan-certificate",
                "PAN",
                "mandatory",
                "Permanent Account Number allotment or registration evidence.",
            ),
            (
                "tan-certificate",
                "TAN",
                "conditional",
                "Tax Deduction Account Number evidence, where applicable.",
            ),
            (
                "gst-registration-certificates",
                "GST registration certificates",
                "conditional",
                "GST registration certificates for active registrations.",
            ),
            (
                "udyam-registration-certificate",
                "Udyam registration certificate",
                "conditional",
                "Udyam registration evidence, where applicable.",
            ),
            (
                "import-export-code",
                "Import Export Code",
                "conditional",
                "IEC evidence for companies engaged in import or export.",
            ),
            (
                "registration-amendment-evidence",
                "Registration amendment evidence",
                "conditional",
                "Amendment or update evidence following name or office changes.",
            ),
        ),
    ),
)


def build_requirement_definitions() -> dict[str, DocumentRequirementDefinition]:
    definitions: dict[str, DocumentRequirementDefinition] = {}
    for group_id, group_title, requirements in DOCUMENT_REQUIREMENT_GROUPS:
        for key, name, level, explanation in requirements:
            definitions[key] = DocumentRequirementDefinition(
                key=key,
                name=name,
                requirement_level=level,
                explanation=explanation,
                group_id=group_id,
                group_title=group_title,
                allow_multiple=key in MULTI_DOCUMENT_REQUIREMENT_KEYS,
            )
    return definitions


REQUIREMENT_DEFINITIONS = build_requirement_definitions()
