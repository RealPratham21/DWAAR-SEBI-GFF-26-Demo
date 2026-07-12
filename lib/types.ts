// Auth types
export interface User {
  id: string;
  email: string;
  companyName?: string;
  isAdmin?: boolean;
}

// Company Profile types
export interface CompanyProfile {
  companyName: string;
  registrationNumber: string;
  sector: string;
  businessDescription: string;
  yearOfIncorporation: number;
  promotersNames: string;
  boardMembers: string;
  keyFinancials: {
    turnover: number;
    profitAfterTax: number;
    totalAssets: number;
    year: number;
  };
}

// Questionnaire types
export interface QuestionnaireAnswer {
  questionId: string;
  sectionId: string;
  answer: string | string[] | number | boolean;
  completed: boolean;
}

export interface QuestionnaireSection {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  completedQuestions: number;
}

export interface Question {
  id: string;
  sectionId: string;
  question: string;
  type: "text" | "textarea" | "number" | "select" | "checkbox" | "radio" | "date";
  options?: string[];
  required: boolean;
  placeholder?: string;
}

// Document types
export interface Document {
  id: string;
  name: string;
  type: string;
  category: string;
  uploadedAt: string;
  status: "pending" | "approved" | "rejected";
  fileSize?: number;
}

// DRHP types
export interface DRHPContent {
  companyInfo: Partial<CompanyProfile>;
  questionnaireSummary: Record<string, any>;
  documentsUploaded: string[];
  generatedAt: string;
  completionPercentage: number;
  gaps: GapItem[];
}

export interface GapItem {
  section: string;
  gap: string;
  severity: "critical" | "high" | "medium" | "low";
  recommendation: string;
}

// Admin Dashboard types
export interface AdminStats {
  totalApplications: number;
  completedApplications: number;
  pendingReview: number;
  rejectedApplications: number;
  averageCompletionTime: number; // in days
}

export interface ApplicationReview {
  id: string;
  companyName: string;
  sector: string;
  completionPercentage: number;
  status: "draft" | "submitted" | "under_review" | "approved" | "rejected";
  submittedAt?: string;
  reviewer?: string;
  comments?: string;
}
