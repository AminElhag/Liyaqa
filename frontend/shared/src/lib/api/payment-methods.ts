import { api } from "./client";
import type {
  PaymentMethod,
  AddPaymentMethodRequest,
  UpdatePaymentMethodRequest,
} from "../../types/payment-method";

const ENDPOINT = "api/me/payment-methods";

/**
 * Get all saved payment methods
 */
export async function getMyPaymentMethods(): Promise<PaymentMethod[]> {
  return api.get(ENDPOINT).json();
}

/**
 * Get a specific payment method
 */
export async function getPaymentMethod(id: string): Promise<PaymentMethod> {
  return api.get(`${ENDPOINT}/${id}`).json();
}

/**
 * Get default payment method
 */
export async function getDefaultPaymentMethod(): Promise<PaymentMethod | null> {
  return api.get(`${ENDPOINT}/default`).json();
}

/**
 * Add a new payment method
 */
export async function addPaymentMethod(
  data: AddPaymentMethodRequest
): Promise<PaymentMethod> {
  return api.post(ENDPOINT, { json: data }).json();
}

/**
 * Set a payment method as default
 */
export async function setDefaultPaymentMethod(id: string): Promise<PaymentMethod> {
  return api.put(`${ENDPOINT}/${id}/default`).json();
}

/**
 * Update a payment method (nickname)
 */
export async function updatePaymentMethod(
  id: string,
  data: UpdatePaymentMethodRequest
): Promise<PaymentMethod> {
  return api.patch(`${ENDPOINT}/${id}`, { json: data }).json();
}

/**
 * Remove a payment method
 */
export async function removePaymentMethod(id: string): Promise<void> {
  await api.delete(`${ENDPOINT}/${id}`);
}

/**
 * Check if member has saved payment methods
 */
export async function hasSavedPaymentMethods(): Promise<boolean> {
  const result = await api
    .get(`${ENDPOINT}/has-saved`)
    .json<{ hasSavedPaymentMethods: boolean }>();
  return result.hasSavedPaymentMethods;
}
