"""Aggregate global facts and evidence (G5)."""

from __future__ import annotations

from dataclasses import dataclass, field

from sqlalchemy.orm import Session

from app.models.user import User
from app.modules.drhp.workstreams import load_all_workstreams
from app.modules.facts_evidence.builders import build_workstream_facts
from app.modules.facts_evidence.ci_enrichment import enrich_ci_document_facts
from app.modules.facts_evidence.conflicts import attach_conflicts
from app.modules.facts_evidence.drhp_usage import DrhpUsageIndex, build_drhp_usage_index
from app.modules.facts_evidence.evidence import build_evidence_registry
from app.modules.facts_evidence.issues_bridge import build_issue_links
from app.modules.facts_evidence.schemas import RawGlobalFact


@dataclass
class FactsEvidenceContext:
    facts: list[RawGlobalFact] = field(default_factory=list)
    drhp_usage: DrhpUsageIndex = field(default_factory=DrhpUsageIndex)
    issue_links: dict[str, list] = field(default_factory=dict)


def aggregate_facts_context(db: Session, user: User) -> FactsEvidenceContext:
    snapshots = load_all_workstreams(db, user.id)
    facts = build_workstream_facts(snapshots)
    facts = enrich_ci_document_facts(db, user, facts)
    attach_conflicts(facts, snapshots)
    usage = build_drhp_usage_index(db, user)
    issue_links = build_issue_links(db, user, facts)
    return FactsEvidenceContext(facts=facts, drhp_usage=usage, issue_links=issue_links)


def aggregate_evidence(db: Session, user: User):
    return build_evidence_registry(db, user)
