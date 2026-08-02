import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  comparisonStatusLabel,
  issueSeverityLabel,
  qualityCategoryLabel,
  readinessStatusLabel,
  reviewStatusLabel,
} from '@/lib/company-incorporation/extraction/labels';
import type {
  ComparisonStatus,
  IssueSeverity,
  IssueStatus,
  QualityCategory,
  ReadinessStatus,
  ReviewStatus,
} from '@/lib/company-incorporation/extraction/types';

/**
 * Every badge carries an explicit text label; tone is supplementary so meaning
 * never depends on colour alone.
 */
export type BadgeTone = 'neutral' | 'positive' | 'caution' | 'critical' | 'informative';

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: 'border-border bg-muted text-muted-foreground',
  positive: 'border-success/30 bg-success/10 text-success',
  caution: 'border-warning/30 bg-warning/10 text-warning',
  critical: 'border-destructive/30 bg-destructive/10 text-destructive',
  informative: 'border-accent/30 bg-accent/10 text-accent',
};

interface StatusBadgeProps {
  label: string;
  tone?: BadgeTone;
  title?: string;
  icon?: ReactNode;
  className?: string;
}

export function StatusBadge({
  label,
  tone = 'neutral',
  title,
  icon,
  className,
}: StatusBadgeProps) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap',
        TONE_CLASSES[tone],
        className,
      )}
    >
      {icon}
      {label}
    </span>
  );
}

export function comparisonTone(status: ComparisonStatus): BadgeTone {
  switch (status) {
    case 'matched':
      return 'positive';
    case 'conflicting':
      return 'critical';
    case 'possible_historical':
    case 'possible_match':
    case 'extractor_disagreement':
      return 'caution';
    case 'no_information':
      return 'informative';
    default:
      return 'neutral';
  }
}

export function ComparisonStatusBadge({
  status,
  className,
}: {
  status: ComparisonStatus;
  className?: string;
}) {
  // "Matched" describes agreement with the Information value only. It is never
  // an approval; approval is recorded separately through review status.
  const title =
    status === 'matched'
      ? 'Document value agrees with the Information value. This is not a review approval.'
      : undefined;
  return (
    <StatusBadge
      label={comparisonStatusLabel(status)}
      tone={comparisonTone(status)}
      title={title}
      className={className}
    />
  );
}

export function reviewTone(status: ReviewStatus): BadgeTone {
  switch (status) {
    case 'approved':
      return 'positive';
    case 'rejected':
      return 'critical';
    case 'historical':
    case 'superseded':
      return 'neutral';
    case 'pending':
      return 'caution';
    default:
      return 'neutral';
  }
}

export function ReviewStatusBadge({
  status,
  className,
}: {
  status: ReviewStatus;
  className?: string;
}) {
  return (
    <StatusBadge
      label={reviewStatusLabel(status)}
      tone={reviewTone(status)}
      className={className}
    />
  );
}

export function qualityTone(category: QualityCategory): BadgeTone {
  switch (category) {
    case 'high':
      return 'positive';
    case 'medium':
      return 'informative';
    case 'low':
      return 'caution';
    case 'review_required':
      return 'critical';
    default:
      return 'neutral';
  }
}

export function QualityBadge({
  category,
  score,
  className,
}: {
  category: QualityCategory;
  score?: number | null;
  className?: string;
}) {
  const label =
    typeof score === 'number'
      ? `${qualityCategoryLabel(category)} · ${Math.round(score * 100)}%`
      : qualityCategoryLabel(category);
  return <StatusBadge label={label} tone={qualityTone(category)} className={className} />;
}

export function SeverityBadge({
  severity,
  blocking,
  className,
}: {
  severity: IssueSeverity;
  blocking?: boolean;
  className?: string;
}) {
  const tone: BadgeTone =
    severity === 'blocking' || blocking ? 'critical' : severity === 'warning' ? 'caution' : 'informative';
  return <StatusBadge label={issueSeverityLabel(severity)} tone={tone} className={className} />;
}

export function severityTone(severity: IssueSeverity | string): BadgeTone {
  if (severity === 'blocking') return 'critical';
  if (severity === 'warning') return 'caution';
  return 'informative';
}

export function issueStatusLabel(status: IssueStatus): string {
  switch (status) {
    case 'open':
      return 'Open';
    case 'awaiting_clarification':
      return 'Awaiting clarification';
    case 'escalated':
      return 'Escalated';
    case 'resolved':
      return 'Resolved';
    case 'dismissed':
      return 'Dismissed';
    default:
      return status || 'Unknown';
  }
}

export function IssueStatusBadge({
  status,
  className,
}: {
  status: IssueStatus;
  className?: string;
}) {
  const tone: BadgeTone =
    status === 'resolved'
      ? 'positive'
      : status === 'escalated'
        ? 'critical'
        : status === 'open' || status === 'awaiting_clarification'
          ? 'caution'
          : 'neutral';
  return <StatusBadge label={issueStatusLabel(status)} tone={tone} className={className} />;
}

function readinessTone(status: ReadinessStatus): BadgeTone {
  switch (status) {
    case 'complete':
    case 'clear':
      return 'positive';
    case 'failed':
    case 'blocking':
      return 'critical';
    case 'review_required':
      return 'caution';
    case 'in_progress':
    case 'processing':
      return 'informative';
    default:
      return 'neutral';
  }
}

export function ReadinessBadge({
  status,
  className,
}: {
  status: ReadinessStatus;
  className?: string;
}) {
  return (
    <StatusBadge
      label={readinessStatusLabel(status)}
      tone={readinessTone(status)}
      className={className}
    />
  );
}
