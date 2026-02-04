import type { UUID } from "./api";

// Blood type enum
export type BloodType =
  | "A_POSITIVE"
  | "A_NEGATIVE"
  | "B_POSITIVE"
  | "B_NEGATIVE"
  | "AB_POSITIVE"
  | "AB_NEGATIVE"
  | "O_POSITIVE"
  | "O_NEGATIVE"
  | "UNKNOWN";

// Member health information entity
export interface MemberHealth {
  id: UUID;
  memberId: UUID;

  // PAR-Q Questions (7 core questions)
  hasHeartCondition: boolean;
  hasChestPainDuringActivity: boolean;
  hasChestPainAtRest: boolean;
  hasDizzinessOrBalance: boolean;
  hasBoneJointProblem: boolean;
  takesBloodPressureMedication: boolean;
  hasOtherReasonNotToExercise: boolean;

  // Health Details
  medicalConditions?: string;
  allergies?: string;
  currentMedications?: string;
  injuriesAndLimitations?: string;
  bloodType?: BloodType;
  emergencyMedicalNotes?: string;

  // Medical Clearance
  requiresMedicalClearance: boolean;
  medicalClearanceDate?: string;
  doctorName?: string;
  doctorPhone?: string;

  // Timestamps
  healthUpdatedAt: string;
  createdAt: string;
  updatedAt: string;
}

// Request DTOs
export interface CreateHealthRequest {
  // PAR-Q Questions
  hasHeartCondition?: boolean;
  hasChestPainDuringActivity?: boolean;
  hasChestPainAtRest?: boolean;
  hasDizzinessOrBalance?: boolean;
  hasBoneJointProblem?: boolean;
  takesBloodPressureMedication?: boolean;
  hasOtherReasonNotToExercise?: boolean;

  // Health Details
  medicalConditions?: string;
  allergies?: string;
  currentMedications?: string;
  injuriesAndLimitations?: string;
  bloodType?: BloodType;
  emergencyMedicalNotes?: string;

  // Doctor Info
  doctorName?: string;
  doctorPhone?: string;
}

export type UpdateHealthRequest = CreateHealthRequest;

// Helper type for PAR-Q answers
export interface ParqAnswers {
  hasHeartCondition: boolean;
  hasChestPainDuringActivity: boolean;
  hasChestPainAtRest: boolean;
  hasDizzinessOrBalance: boolean;
  hasBoneJointProblem: boolean;
  takesBloodPressureMedication: boolean;
  hasOtherReasonNotToExercise: boolean;
}

// Helper function to check if medical clearance is needed
export function needsMedicalClearance(parq: ParqAnswers): boolean {
  return (
    parq.hasHeartCondition ||
    parq.hasChestPainDuringActivity ||
    parq.hasChestPainAtRest ||
    parq.hasDizzinessOrBalance ||
    parq.hasBoneJointProblem ||
    parq.takesBloodPressureMedication ||
    parq.hasOtherReasonNotToExercise
  );
}
