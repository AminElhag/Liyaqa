import { api } from "./client";
import type {
  EnrollmentRequest,
  EnrollmentPreviewRequest,
  EnrollmentPreviewResponse,
  EnrollmentResponse,
} from "../../types/enrollment";

const ENDPOINT = "api/enrollment";

export async function previewEnrollment(
  data: EnrollmentPreviewRequest
): Promise<EnrollmentPreviewResponse> {
  return api.post(`${ENDPOINT}/preview`, { json: data }).json();
}

export async function createEnrollment(
  data: EnrollmentRequest
): Promise<EnrollmentResponse> {
  return api.post(ENDPOINT, { json: data }).json();
}
