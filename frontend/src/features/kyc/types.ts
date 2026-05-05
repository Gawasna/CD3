export type KycStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface KycPersonalInfo {
  fullName: string;
  dateOfBirth: string;
  idNumber: string;
  country: string;
}

export interface KycUploadFile {
  name: string;
  status: 'ready' | 'missing' | 'error';
}

export interface KycFormState {
  personalInfo: KycPersonalInfo;
  frontFile: KycUploadFile | null;
  backFile: KycUploadFile | null;
  selfieFile: KycUploadFile | null;
  consentAccepted: boolean;
  currentStep: 1 | 2 | 3 | 4;
}

export interface KycVerificationRecord {
  submittedAt: string;
  reviewedAt?: string;
  reviewerNote?: string;
  rejectionReason?: string;
}
