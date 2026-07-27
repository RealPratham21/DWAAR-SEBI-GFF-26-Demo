import type {
  CompanyCategory,
  CompanyClass,
  SpecialCompanyType,
} from '@/lib/schemas/company-incorporation';
import {
  COMPANY_CATEGORY_LABELS,
  COMPANY_CLASS_SUMMARY_LABELS,
  COMPANY_SUB_CATEGORY_LABELS,
  SPECIAL_COMPANY_TYPE_LABELS,
} from '@/lib/types/company-incorporation';

type ClassificationFields = {
  companyClass?: string;
  companyCategory?: string;
  companySubCategory?: string;
  specialCompanyType?: string;
};

export function buildClassificationSummary(fields: ClassificationFields): string {
  const parts: string[] = [];

  const classLabel =
    fields.companyClass &&
    fields.companyClass in COMPANY_CLASS_SUMMARY_LABELS
      ? COMPANY_CLASS_SUMMARY_LABELS[fields.companyClass as CompanyClass]
      : '';
  const categoryLabel =
    fields.companyCategory &&
    fields.companyCategory in COMPANY_CATEGORY_LABELS
      ? COMPANY_CATEGORY_LABELS[fields.companyCategory as CompanyCategory].toLowerCase()
      : '';

  if (classLabel && categoryLabel) {
    parts.push(`${classLabel} ${categoryLabel}`);
  } else if (classLabel) {
    parts.push(classLabel);
  } else if (categoryLabel) {
    parts.push(categoryLabel);
  }

  if (
    fields.companySubCategory &&
    fields.companySubCategory in COMPANY_SUB_CATEGORY_LABELS
  ) {
    parts.push(
      COMPANY_SUB_CATEGORY_LABELS[
        fields.companySubCategory as keyof typeof COMPANY_SUB_CATEGORY_LABELS
      ],
    );
  }

  let summary = parts.join(' — ');

  if (
    fields.specialCompanyType &&
    fields.specialCompanyType !== 'none' &&
    fields.specialCompanyType in SPECIAL_COMPANY_TYPE_LABELS
  ) {
    const specialLabel = SPECIAL_COMPANY_TYPE_LABELS[fields.specialCompanyType as SpecialCompanyType];
    summary = summary ? `${summary} — ${specialLabel}` : specialLabel;
  }

  return summary;
}
