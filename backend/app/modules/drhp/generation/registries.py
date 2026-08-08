"""Person and Entity registries from snapshot workstreams."""

from __future__ import annotations

from typing import Any

from app.modules.drhp.sources.models import SourceRef
from app.modules.drhp.workstreams import WorkstreamSnapshot


def _clean(value: Any) -> str:
    return str(value or "").strip()


def build_person_registry(
    snapshots: dict[str, WorkstreamSnapshot],
) -> tuple[dict[str, Any], list[SourceRef]]:
    persons: dict[str, dict[str, Any]] = {}
    refs: list[SourceRef] = []

    mg = snapshots.get("management-governance")
    if mg:
        directors_section = mg.payload.get("directorsProfilesAppointmentsAndEligibility") or {}
        for director in directors_section.get("directors") or []:
            if not isinstance(director, dict):
                continue
            person_id = _clean(director.get("id"))
            if not person_id:
                continue
            entry = {
                "id": person_id,
                "fullName": _clean(director.get("fullName")),
                "roles": ["director"],
                "linkedDirectorId": person_id,
                "sourceWorkstreams": ["management-governance"],
            }
            persons[person_id] = entry
            refs.append(
                SourceRef(
                    ref_id=f"person:{person_id}",
                    workstream_key="management-governance",
                    section_key="directors-profiles-appointments-and-eligibility",
                    record_id=person_id,
                    field_path="directors[].fullName",
                    field_label="Director",
                    source_type="structured_user_input",
                    value_preview=entry["fullName"],
                    workspace_version=mg.version,
                )
            )
        kmp_section = mg.payload.get("kmpSeniorManagementAndOrganisationStructure") or {}
        for kmp in kmp_section.get("kmpSmpRecords") or []:
            if not isinstance(kmp, dict):
                continue
            person_id = _clean(kmp.get("id"))
            if not person_id:
                continue
            linked_director = _clean(kmp.get("linkedDirectorId"))
            if linked_director and linked_director in persons:
                persons[linked_director]["roles"].append("kmp")
                continue
            entry = {
                "id": person_id,
                "fullName": _clean(kmp.get("fullName")),
                "roles": ["kmp"],
                "linkedDirectorId": linked_director,
                "sourceWorkstreams": ["management-governance"],
            }
            persons[person_id] = entry
            refs.append(
                SourceRef(
                    ref_id=f"person:{person_id}",
                    workstream_key="management-governance",
                    section_key="kmp-senior-management-and-organisation-structure",
                    record_id=person_id,
                    field_path="kmpSmpRecords[].fullName",
                    field_label="KMP/SMP",
                    source_type="structured_user_input",
                    value_preview=entry["fullName"],
                    workspace_version=mg.version,
                )
            )

    capital = snapshots.get("capital-ownership")
    if capital:
        promoters_section = capital.payload.get("promotersAndControl") or {}
        for promoter in promoters_section.get("promoters") or []:
            if not isinstance(promoter, dict):
                continue
            person_id = _clean(promoter.get("id"))
            if not person_id:
                continue
            if person_id in persons:
                persons[person_id]["roles"].append("promoter")
                persons[person_id]["sourceWorkstreams"].append("capital-ownership")
            else:
                persons[person_id] = {
                    "id": person_id,
                    "fullName": _clean(promoter.get("fullName")),
                    "roles": ["promoter"],
                    "linkedDirectorId": "",
                    "sourceWorkstreams": ["capital-ownership"],
                }
            refs.append(
                SourceRef(
                    ref_id=f"person:{person_id}:promoter",
                    workstream_key="capital-ownership",
                    section_key="promoters-and-control",
                    record_id=person_id,
                    field_path="promoters[].fullName",
                    field_label="Promoter",
                    source_type="structured_user_input",
                    value_preview=_clean(promoter.get("fullName")),
                    workspace_version=capital.version,
                )
            )

    return {"persons": list(persons.values()), "unresolvedLinks": []}, refs


def build_entity_registry(
    snapshots: dict[str, WorkstreamSnapshot],
) -> tuple[dict[str, Any], list[SourceRef]]:
    entities: dict[str, dict[str, Any]] = {}
    refs: list[SourceRef] = []

    ge = snapshots.get("group-entities-related-parties")
    if ge:
        master = ge.payload.get("groupStructureAndEntityMaster") or {}
        for entity in master.get("entities") or []:
            if not isinstance(entity, dict):
                continue
            entity_id = _clean(entity.get("id"))
            if not entity_id:
                continue
            identity = entity.get("identity") if isinstance(entity.get("identity"), dict) else {}
            entry = {
                "id": entity_id,
                "legalName": _clean(identity.get("legalName")),
                "displayName": _clean(identity.get("displayName")),
                "classificationBadges": entity.get("classificationBadges") or [],
                "sourceWorkstreams": ["group-entities-related-parties"],
            }
            entities[entity_id] = entry
            refs.append(
                SourceRef(
                    ref_id=f"entity:{entity_id}",
                    workstream_key="group-entities-related-parties",
                    section_key="group-structure-and-entity-master",
                    record_id=entity_id,
                    field_path="entities[].identity.legalName",
                    field_label="Group entity",
                    source_type="structured_user_input",
                    value_preview=entry["legalName"],
                    workspace_version=ge.version,
                )
            )

    return {"entities": list(entities.values())}, refs
