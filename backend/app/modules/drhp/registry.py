"""Versioned DRHP chapter-readiness registry.

Readiness rules live here — not in route handlers.
"""

from __future__ import annotations

from collections.abc import Callable, Mapping
from dataclasses import dataclass, field
from typing import Any

from app.modules.drhp.constants import (
    ALL_CHAPTER_KEYS,
    CHAPTER_TITLES,
    REGISTRY_VERSION,
    SUPPORTED_CHAPTER_KEYS,
    RequirementClassification,
    SourceAdapterKey,
)

Payload = dict[str, Any]
ValueResolver = Callable[[Payload], Any]
PresenceResolver = Callable[[Payload], bool]


def _clean(value: Any) -> str:
    return str(value or "").strip()


def _identity(field: str) -> ValueResolver:
    def resolve(payload: Payload) -> Any:
        identity = payload.get("identity") if isinstance(payload.get("identity"), dict) else {}
        return identity.get(field)

    return resolve


def _has_identity(field: str) -> PresenceResolver:
    def present(payload: Payload) -> bool:
        return bool(_clean(_identity(field)(payload)))

    return present


def _incorporation_place(payload: Payload) -> str | None:
    city = _clean(_identity("incorporationCity")(payload))
    state = _clean(_identity("incorporationState")(payload))
    if city and state:
        return f"{city}, {state}"
    return city or state or None


def _has_incorporation_place(payload: Payload) -> bool:
    return bool(_incorporation_place(payload))


def _current_registered_office(payload: Payload) -> dict[str, Any] | None:
    matches = [
        office
        for office in payload.get("offices") or []
        if isinstance(office, dict)
        and _clean(office.get("officeType")) == "registered-office"
        and not _clean(office.get("effectiveUntil"))
    ]
    if not matches:
        return None
    if len(matches) == 1:
        return matches[0]
    return max(matches, key=lambda office: _clean(office.get("effectiveFrom")))


def _format_address(office: Mapping[str, Any] | None) -> str | None:
    if not office:
        return None
    parts = [
        _clean(office.get(key))
        for key in (
            "addressLine1",
            "addressLine2",
            "locality",
            "city",
            "district",
            "state",
            "pinCode",
            "country",
        )
    ]
    joined = ", ".join(part for part in parts if part)
    return joined or None


def _registered_office_value(payload: Payload) -> str | None:
    return _format_address(_current_registered_office(payload))


def _has_registered_office(payload: Payload) -> bool:
    office = _current_registered_office(payload)
    if office is None:
        return False
    return bool(_clean(office.get("addressLine1")) and _clean(office.get("city")))


def _find_events(payload: Payload, *event_types: str) -> list[dict[str, Any]]:
    wanted = set(event_types)
    return [
        event
        for event in payload.get("corporateEvents") or []
        if isinstance(event, dict) and _clean(event.get("eventType")) in wanted
    ]


def _has_event(payload: Payload, *event_types: str) -> bool:
    return bool(_find_events(payload, *event_types))


def _event_summary(payload: Payload, *event_types: str) -> Any:
    events = _find_events(payload, *event_types)
    if not events:
        return None
    return [
        {
            "id": event.get("id"),
            "eventType": event.get("eventType"),
            "eventStatus": event.get("eventStatus"),
            "effectiveDate": event.get("effectiveDate"),
            "description": event.get("description"),
            "reason": event.get("reason"),
            "previousValue": event.get("previousValue"),
            "newValue": event.get("newValue"),
            "filingForm": event.get("filingForm"),
            "srn": event.get("srn"),
        }
        for event in events
    ]


def _previous_office(payload: Payload) -> dict[str, Any] | None:
    explicit = [
        office
        for office in payload.get("offices") or []
        if isinstance(office, dict)
        and _clean(office.get("officeType")) == "previous-registered-office"
    ]
    if explicit:
        return explicit[0]
    historical = [
        office
        for office in payload.get("offices") or []
        if isinstance(office, dict)
        and _clean(office.get("officeType")) == "registered-office"
        and _clean(office.get("effectiveUntil"))
    ]
    if not historical:
        return None
    return max(historical, key=lambda office: _clean(office.get("effectiveUntil")))


def _registered_office_history_value(payload: Payload) -> Any:
    current = _current_registered_office(payload)
    previous = _previous_office(payload)
    change_events = _find_events(
        payload,
        "registered-office-change",
        "registered-office-state-change",
        "roc-jurisdiction-change",
    )
    if not current and not previous and not change_events:
        return None
    return {
        "current": _format_address(current),
        "previous": _format_address(previous),
        "changeEvents": _event_summary(
            payload,
            "registered-office-change",
            "registered-office-state-change",
            "roc-jurisdiction-change",
        )
        or [],
    }


def _has_registered_office_history(payload: Payload) -> bool:
    return _has_registered_office(payload) or bool(
        _find_events(
            payload,
            "registered-office-change",
            "registered-office-state-change",
            "roc-jurisdiction-change",
        )
    )


def _constitutional_field(field: str) -> ValueResolver:
    def resolve(payload: Payload) -> Any:
        record = (
            payload.get("constitutionalRecord")
            if isinstance(payload.get("constitutionalRecord"), dict)
            else {}
        )
        return record.get(field)

    return resolve


def _has_constitutional(field: str) -> PresenceResolver:
    def present(payload: Payload) -> bool:
        value = _constitutional_field(field)(payload)
        if isinstance(value, list):
            return any(_clean(item) for item in value)
        return bool(_clean(value))

    return present


def _moa_amendments_value(payload: Payload) -> Any:
    amendments = [
        item
        for item in payload.get("constitutionalAmendments") or []
        if isinstance(item, dict) and _clean(item.get("documentType")) == "moa"
    ]
    return amendments or None


def _has_moa_amendments(payload: Payload) -> bool:
    return _moa_amendments_value(payload) is not None


def _find_registration(payload: Payload, registration_type: str) -> dict[str, Any] | None:
    for registration in payload.get("registrations") or []:
        if not isinstance(registration, dict):
            continue
        if _clean(registration.get("registrationType")) == registration_type:
            return registration
    return None


def _registration_value(registration_type: str) -> ValueResolver:
    def resolve(payload: Payload) -> Any:
        registration = _find_registration(payload, registration_type)
        if registration is None:
            return None
        return {
            "registrationType": registration.get("registrationType"),
            "registrationNumber": registration.get("registrationNumber"),
            "legalNameOnRegistration": registration.get("legalNameOnRegistration"),
            "addressOnRegistration": registration.get("addressOnRegistration"),
            "issueDate": registration.get("issueDate"),
            "effectiveDate": registration.get("effectiveDate"),
            "currentStatus": registration.get("currentStatus"),
        }

    return resolve


def _has_registration(registration_type: str) -> PresenceResolver:
    def present(payload: Payload) -> bool:
        registration = _find_registration(payload, registration_type)
        if registration is None:
            return False
        return bool(_clean(registration.get("registrationNumber")))

    return present


def _has_any_tax_registration(payload: Payload) -> bool:
    return any(
        _has_registration(kind)(payload) for kind in ("pan", "tan", "gstin", "udyam", "iec")
    )


def _tax_registrations_value(payload: Payload) -> Any:
    rows = []
    for kind in ("pan", "tan", "gstin", "udyam", "iec"):
        value = _registration_value(kind)(payload)
        if value is not None and _clean(value.get("registrationNumber")):
            rows.append(value)
    return rows or None


@dataclass(frozen=True, slots=True)
class WorkstreamLink:
    slug: str
    title: str
    href: str
    section_id: str | None = None


@dataclass(frozen=True, slots=True)
class ChapterRequirement:
    key: str
    label: str
    classification: str
    source_adapter: str
    blocks_generation: bool
    placeholder_allowed: bool
    historical: bool = False
    information_paths: tuple[str, ...] = ()
    fact_keys: tuple[str, ...] = ()
    resolve_value: ValueResolver | None = None
    is_present: PresenceResolver | None = None
    """When True, empty/missing Information proves nothing — stay unknown_applicability."""
    empty_means_unknown: bool = False
    """When True, never treat as satisfied even if rows exist (completeness cannot be proven)."""
    force_unknown: bool = False
    workstream_link: WorkstreamLink | None = None
    notes: str = ""


@dataclass(frozen=True, slots=True)
class ChapterDefinition:
    key: str
    title: str
    order: int
    source_adapter: str
    requirements: tuple[ChapterRequirement, ...] = field(default_factory=tuple)
    workstream_links: tuple[WorkstreamLink, ...] = field(default_factory=tuple)

    @property
    def supported(self) -> bool:
        return self.key in SUPPORTED_CHAPTER_KEYS


_CI_IDENTITY = WorkstreamLink(
    slug="company-incorporation",
    title="Company & Incorporation",
    href="/projects/demo/workstreams/company-incorporation?tab=information",
    section_id="legal-identity",
)
_CI_HISTORY = WorkstreamLink(
    slug="company-incorporation",
    title="Company & Incorporation",
    href="/projects/demo/workstreams/company-incorporation?tab=information",
    section_id="corporate-history",
)
_CI_OFFICES = WorkstreamLink(
    slug="company-incorporation",
    title="Company & Incorporation",
    href="/projects/demo/workstreams/company-incorporation?tab=information",
    section_id="offices-contact",
)
_CI_CONSTITUTIONAL = WorkstreamLink(
    slug="company-incorporation",
    title="Company & Incorporation",
    href="/projects/demo/workstreams/company-incorporation?tab=information",
    section_id="constitutional-documents",
)
_CI_REGISTRATIONS = WorkstreamLink(
    slug="company-incorporation",
    title="Company & Incorporation",
    href="/projects/demo/workstreams/company-incorporation?tab=information",
    section_id="core-registrations",
)
_CI_DOCUMENTS = WorkstreamLink(
    slug="company-incorporation",
    title="Company & Incorporation — Documents",
    href="/projects/demo/workstreams/company-incorporation?tab=documents",
)


def _ci_req(
    key: str,
    label: str,
    *,
    classification: str,
    blocks_generation: bool = False,
    placeholder_allowed: bool = False,
    historical: bool = False,
    information_paths: tuple[str, ...] = (),
    fact_keys: tuple[str, ...] = (),
    resolve_value: ValueResolver | None = None,
    is_present: PresenceResolver | None = None,
    empty_means_unknown: bool = False,
    force_unknown: bool = False,
    workstream_link: WorkstreamLink | None = None,
    notes: str = "",
) -> ChapterRequirement:
    return ChapterRequirement(
        key=key,
        label=label,
        classification=classification,
        source_adapter=SourceAdapterKey.COMPANY_INCORPORATION,
        blocks_generation=blocks_generation,
        placeholder_allowed=placeholder_allowed,
        historical=historical,
        information_paths=information_paths,
        fact_keys=fact_keys,
        resolve_value=resolve_value,
        is_present=is_present,
        empty_means_unknown=empty_means_unknown,
        force_unknown=force_unknown,
        workstream_link=workstream_link,
        notes=notes,
    )


def _future_gap(key: str, label: str, *, notes: str = "") -> ChapterRequirement:
    return ChapterRequirement(
        key=key,
        label=label,
        classification=RequirementClassification.FUTURE_GAP,
        source_adapter=SourceAdapterKey.NONE,
        blocks_generation=False,
        placeholder_allowed=True,
        notes=notes or "Not connected to a workstream in G1.",
    )


def _unknown_topic(
    key: str,
    label: str,
    *,
    information_paths: tuple[str, ...] = (),
    fact_keys: tuple[str, ...] = (),
    resolve_value: ValueResolver | None = None,
    is_present: PresenceResolver | None = None,
    force_unknown: bool = False,
    workstream_link: WorkstreamLink | None = None,
    notes: str = "",
) -> ChapterRequirement:
    return _ci_req(
        key,
        label,
        classification=RequirementClassification.UNKNOWN_APPLICABILITY,
        placeholder_allowed=True,
        information_paths=information_paths,
        fact_keys=fact_keys,
        resolve_value=resolve_value,
        is_present=is_present,
        empty_means_unknown=True,
        force_unknown=force_unknown,
        workstream_link=workstream_link,
        notes=notes
        or "Empty or missing rows are not treated as a declaration that nothing occurred.",
    )


COVER_PAGE_REQUIREMENTS: tuple[ChapterRequirement, ...] = (
    _ci_req(
        "cover.legalName",
        "Legal name",
        classification=RequirementClassification.REQUIRED,
        blocks_generation=True,
        information_paths=("identity.legalName",),
        fact_keys=("identity.legalName",),
        resolve_value=_identity("legalName"),
        is_present=_has_identity("legalName"),
        workstream_link=_CI_IDENTITY,
    ),
    _ci_req(
        "cover.cin",
        "CIN",
        classification=RequirementClassification.REQUIRED,
        blocks_generation=True,
        information_paths=("identity.cin",),
        fact_keys=("identity.cin",),
        resolve_value=_identity("cin"),
        is_present=_has_identity("cin"),
        workstream_link=_CI_IDENTITY,
    ),
    _ci_req(
        "cover.incorporationDate",
        "Incorporation date",
        classification=RequirementClassification.REQUIRED,
        blocks_generation=True,
        information_paths=("identity.incorporationDate",),
        fact_keys=("identity.incorporationDate",),
        resolve_value=_identity("incorporationDate"),
        is_present=_has_identity("incorporationDate"),
        workstream_link=_CI_IDENTITY,
    ),
    _ci_req(
        "cover.incorporationPlace",
        "Incorporation place",
        classification=RequirementClassification.OPTIONAL,
        information_paths=("identity.incorporationCity", "identity.incorporationState"),
        fact_keys=("identity.incorporationState",),
        resolve_value=_incorporation_place,
        is_present=_has_incorporation_place,
        workstream_link=_CI_IDENTITY,
    ),
    _ci_req(
        "cover.companyClass",
        "Company class",
        classification=RequirementClassification.OPTIONAL,
        information_paths=("identity.companyClass",),
        fact_keys=("identity.companyClass",),
        resolve_value=_identity("companyClass"),
        is_present=_has_identity("companyClass"),
        workstream_link=_CI_IDENTITY,
    ),
    _ci_req(
        "cover.companyCategory",
        "Company category",
        classification=RequirementClassification.OPTIONAL,
        information_paths=("identity.companyCategory",),
        fact_keys=("identity.companyCategory",),
        resolve_value=_identity("companyCategory"),
        is_present=_has_identity("companyCategory"),
        workstream_link=_CI_IDENTITY,
    ),
    _ci_req(
        "cover.registeredOffice",
        "Registered office",
        classification=RequirementClassification.OPTIONAL,
        information_paths=("offices.currentRegistered.address",),
        fact_keys=("offices.currentRegistered.address",),
        resolve_value=_registered_office_value,
        is_present=_has_registered_office,
        workstream_link=_CI_OFFICES,
    ),
    _ci_req(
        "cover.website",
        "Website",
        classification=RequirementClassification.OPTIONAL,
        information_paths=("identity.website",),
        resolve_value=_identity("website"),
        is_present=_has_identity("website"),
        workstream_link=_CI_IDENTITY,
    ),
    _ci_req(
        "cover.email",
        "Email",
        classification=RequirementClassification.OPTIONAL,
        information_paths=("identity.email",),
        resolve_value=_identity("email"),
        is_present=_has_identity("email"),
        workstream_link=_CI_IDENTITY,
    ),
    _ci_req(
        "cover.telephone",
        "Telephone",
        classification=RequirementClassification.OPTIONAL,
        information_paths=("identity.telephone",),
        resolve_value=_identity("telephone"),
        is_present=_has_identity("telephone"),
        workstream_link=_CI_IDENTITY,
    ),
    _future_gap(
        "cover.issueDetails",
        "Issue / offer details",
        notes="Objects of the Issue and offer terms are not connected in G1.",
    ),
    _future_gap(
        "cover.promoters",
        "Promoter details",
        notes="Capital & Ownership workstream is not connected in G1.",
    ),
    _future_gap(
        "cover.exchangeDetails",
        "Stock exchange details",
        notes="Exchange listing details are not connected in G1.",
    ),
    _future_gap(
        "cover.intermediaries",
        "Intermediaries / merchant banker",
        notes="Merchant banker and intermediary appointments are not connected in G1.",
    ),
)


COMPANY_HISTORY_REQUIREMENTS: tuple[ChapterRequirement, ...] = (
    _ci_req(
        "history.legalIdentity",
        "Legal identity and incorporation",
        classification=RequirementClassification.REQUIRED,
        blocks_generation=True,
        information_paths=(
            "identity.legalName",
            "identity.cin",
            "identity.incorporationDate",
            "identity.companyClass",
            "identity.companyCategory",
            "identity.governingAct",
        ),
        fact_keys=(
            "identity.legalName",
            "identity.cin",
            "identity.incorporationDate",
            "identity.companyClass",
            "identity.companyCategory",
            "identity.governingAct",
        ),
        resolve_value=lambda payload: {
            "legalName": _identity("legalName")(payload),
            "cin": _identity("cin")(payload),
            "incorporationDate": _identity("incorporationDate")(payload),
            "incorporationPlace": _incorporation_place(payload),
            "companyClass": _identity("companyClass")(payload),
            "companyCategory": _identity("companyCategory")(payload),
            "governingAct": _identity("governingAct")(payload),
        },
        is_present=lambda payload: (
            _has_identity("legalName")(payload)
            and _has_identity("cin")(payload)
            and _has_identity("incorporationDate")(payload)
        ),
        workstream_link=_CI_IDENTITY,
    ),
    _ci_req(
        "history.originalIncorporationEvent",
        "Original incorporation event",
        classification=RequirementClassification.REQUIRED,
        blocks_generation=True,
        information_paths=("corporateEvents[original-incorporation]",),
        fact_keys=("corporateHistory.originalIncorporation.effectiveDate",),
        resolve_value=lambda payload: _event_summary(payload, "original-incorporation"),
        is_present=lambda payload: _has_event(payload, "original-incorporation"),
        workstream_link=_CI_HISTORY,
    ),
    _ci_req(
        "history.registeredOfficeHistory",
        "Registered-office history",
        classification=RequirementClassification.REQUIRED,
        information_paths=(
            "offices.currentRegistered.address",
            "offices.previousRegistered.address",
            "corporateEvents[registered-office-change]",
        ),
        fact_keys=(
            "offices.currentRegistered.address",
            "offices.previousRegistered.address",
            "corporateHistory.officeChange.effectiveDate",
            "corporateHistory.officeChange.previousAddress",
            "corporateHistory.officeChange.newAddress",
            "registrations.gstin.addressOnRegistration",
        ),
        resolve_value=_registered_office_history_value,
        is_present=_has_registered_office_history,
        historical=False,
        workstream_link=_CI_OFFICES,
        notes="Current office from Information; historical Chakan values may only support history.",
    ),
    _ci_req(
        "history.mainObjects",
        "Main objects",
        classification=RequirementClassification.REQUIRED,
        information_paths=(
            "constitutionalRecord.mainObjectText",
            "constitutionalRecord.mainObjectClauseNumbers",
        ),
        fact_keys=(
            "constitutionalRecord.mainObjectText",
            "constitutionalRecord.mainObjectClauseNumbers",
        ),
        resolve_value=lambda payload: {
            "mainObjectClauseNumbers": _constitutional_field("mainObjectClauseNumbers")(payload),
            "mainObjectText": _constitutional_field("mainObjectText")(payload),
        },
        is_present=_has_constitutional("mainObjectText"),
        workstream_link=_CI_CONSTITUTIONAL,
    ),
    _ci_req(
        "history.constitutionalRecord",
        "Constitutional record",
        classification=RequirementClassification.REQUIRED,
        information_paths=(
            "constitutionalRecord.moaVersionDate",
            "constitutionalRecord.aoaVersionDate",
        ),
        fact_keys=(
            "constitutionalRecord.moaVersionDate",
            "constitutionalRecord.aoaVersionDate",
        ),
        resolve_value=lambda payload: {
            "moaVersionDate": _constitutional_field("moaVersionDate")(payload),
            "aoaVersionDate": _constitutional_field("aoaVersionDate")(payload),
            "moaCertifiedCopyStatus": _constitutional_field("moaCertifiedCopyStatus")(payload),
            "aoaCertifiedCopyStatus": _constitutional_field("aoaCertifiedCopyStatus")(payload),
        },
        is_present=lambda payload: (
            _has_constitutional("moaVersionDate")(payload)
            and _has_constitutional("aoaVersionDate")(payload)
        ),
        workstream_link=_CI_CONSTITUTIONAL,
    ),
    _ci_req(
        "history.taxRegistrations",
        "Corporate and tax registrations",
        classification=RequirementClassification.REQUIRED,
        information_paths=("registrations[]",),
        fact_keys=(
            "registrations.pan.registrationNumber",
            "registrations.gstin.registrationNumber",
            "registrations.udyam.registrationNumber",
        ),
        resolve_value=_tax_registrations_value,
        is_present=_has_any_tax_registration,
        workstream_link=_CI_REGISTRATIONS,
    ),
    _ci_req(
        "history.nameClassConversionEvents",
        "Name, class or conversion events (when present)",
        classification=RequirementClassification.CONDITIONAL,
        information_paths=("corporateEvents[name-change|conversion]",),
        resolve_value=lambda payload: _event_summary(
            payload,
            "name-change",
            "private-to-public-conversion",
            "public-to-private-conversion",
            "company-class-change",
        ),
        is_present=lambda payload: _has_event(
            payload,
            "name-change",
            "private-to-public-conversion",
            "public-to-private-conversion",
            "company-class-change",
        ),
        empty_means_unknown=True,
        workstream_link=_CI_HISTORY,
        notes="Satisfied only when matching events exist; absence is unknown applicability.",
    ),
    _ci_req(
        "history.moaAmendmentsPresent",
        "MoA amendments (when present)",
        classification=RequirementClassification.CONDITIONAL,
        information_paths=("constitutionalAmendments[moa]",),
        resolve_value=_moa_amendments_value,
        is_present=_has_moa_amendments,
        empty_means_unknown=True,
        workstream_link=_CI_CONSTITUTIONAL,
        notes="Satisfied only when MoA amendment rows exist; empty list is unknown applicability.",
    ),
    _unknown_topic(
        "history.previousNames",
        "Previous names, dates and reasons",
        resolve_value=lambda payload: _event_summary(payload, "name-change"),
        is_present=lambda payload: _has_event(payload, "name-change"),
        workstream_link=_CI_HISTORY,
    ),
    _unknown_topic(
        "history.legalFormConversions",
        "Legal-form conversions",
        resolve_value=lambda payload: _event_summary(
            payload,
            "private-to-public-conversion",
            "public-to-private-conversion",
            "company-class-change",
        ),
        is_present=lambda payload: _has_event(
            payload,
            "private-to-public-conversion",
            "public-to-private-conversion",
            "company-class-change",
        ),
        workstream_link=_CI_HISTORY,
    ),
    _unknown_topic(
        "history.mergersAcquisitions",
        "Mergers, acquisitions, divestments and revaluations",
        resolve_value=lambda payload: _event_summary(
            payload,
            "merger-amalgamation",
            "demerger",
            "acquisition-transfer-undertaking",
            "succession-of-business",
        ),
        is_present=lambda payload: _has_event(
            payload,
            "merger-amalgamation",
            "demerger",
            "acquisition-transfer-undertaking",
            "succession-of-business",
        ),
        workstream_link=_CI_HISTORY,
    ),
    _unknown_topic(
        "history.completeMoaAmendmentHistory",
        "Complete MoA amendment history",
        resolve_value=_moa_amendments_value,
        is_present=_has_moa_amendments,
        force_unknown=True,
        workstream_link=_CI_CONSTITUTIONAL,
        notes="Presence of some amendments does not prove completeness without an explicit declaration.",
    ),
    _unknown_topic(
        "history.holdingsSubsidiariesJv",
        "Holding companies, subsidiaries and joint ventures",
        force_unknown=True,
        notes="No C&I schema path for group entities in G1.",
    ),
    _ci_req(
        "history.historicalOfficeEvidence",
        "Historical registered-office evidence",
        classification=RequirementClassification.OPTIONAL,
        historical=True,
        information_paths=("offices.previousRegistered.address",),
        fact_keys=(
            "offices.previousRegistered.address",
            "registrations.gstin.addressOnRegistration",
        ),
        resolve_value=lambda payload: {
            "previousOffice": _format_address(_previous_office(payload)),
            "officeChangeEvents": _event_summary(payload, "registered-office-change"),
        },
        is_present=lambda payload: _previous_office(payload) is not None
        or _has_event(payload, "registered-office-change"),
        workstream_link=_CI_DOCUMENTS,
        notes="Historical assertions (e.g. Chakan GST) may support this item only.",
    ),
)


def _unsupported_chapter(key: str, order: int) -> ChapterDefinition:
    return ChapterDefinition(
        key=key,
        title=CHAPTER_TITLES[key],
        order=order,
        source_adapter=SourceAdapterKey.NONE,
        requirements=(),
        workstream_links=(),
    )


CHAPTER_DEFINITIONS: dict[str, ChapterDefinition] = {
    "cover-page-front-matter": ChapterDefinition(
        key="cover-page-front-matter",
        title=CHAPTER_TITLES["cover-page-front-matter"],
        order=1,
        source_adapter=SourceAdapterKey.COMPANY_INCORPORATION,
        requirements=COVER_PAGE_REQUIREMENTS,
        workstream_links=(_CI_IDENTITY, _CI_OFFICES, _CI_DOCUMENTS),
    ),
    "company-history-promoters-structure": ChapterDefinition(
        key="company-history-promoters-structure",
        title=CHAPTER_TITLES["company-history-promoters-structure"],
        order=11,
        source_adapter=SourceAdapterKey.COMPANY_INCORPORATION,
        requirements=COMPANY_HISTORY_REQUIREMENTS,
        workstream_links=(
            _CI_IDENTITY,
            _CI_HISTORY,
            _CI_OFFICES,
            _CI_CONSTITUTIONAL,
            _CI_REGISTRATIONS,
            _CI_DOCUMENTS,
        ),
    ),
}

for _index, _key in enumerate(ALL_CHAPTER_KEYS, start=1):
    if _key not in CHAPTER_DEFINITIONS:
        CHAPTER_DEFINITIONS[_key] = _unsupported_chapter(_key, _index)


def get_chapter_definition(chapter_key: str) -> ChapterDefinition | None:
    from app.modules.drhp.constants import resolve_chapter_key

    resolved = resolve_chapter_key(chapter_key) or chapter_key
    return CHAPTER_DEFINITIONS.get(resolved)


def iter_chapter_definitions() -> list[ChapterDefinition]:
    return [CHAPTER_DEFINITIONS[key] for key in ALL_CHAPTER_KEYS]


def registry_meta() -> dict[str, str]:
    return {"registryVersion": REGISTRY_VERSION}
