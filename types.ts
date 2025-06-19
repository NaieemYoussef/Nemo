export enum OperationType {
  LINGUISTIC_CHECK = 'LINGUISTIC_CHECK',
  IMPROVE_PHRASING = 'IMPROVE_PHRASING',
  FACT_CHECK = 'FACT_CHECK',
  PLAGIARISM_CHECK = 'PLAGIARISM_CHECK',
  REPHRASE = 'REPHRASE',
  COMPREHENSIVE_CHECK = 'COMPREHENSIVE_CHECK', // New combined operation
}

export interface GroundingSource {
  web?: {
    uri?: string;
    title?: string;
  };
  news?: {
    uri?: string;
    title?: string;
    publicationDate?: { year: number, month: number, day: number };
    publisher?: string;
    snippet?: string;
  }
}

// Added for FactCheckResultCard
export type AssessmentStatus = "صحيح" | "خاطئ" | "يحتاج لتوضيح" | "تعذر التحقق" | "غير دقيق";

export interface FactCheckItem {
  original_claim: string;
  assessment_status: AssessmentStatus;
  assessment_details: string;
  // Optional: corrected_claim could be added if the model provides it
}
