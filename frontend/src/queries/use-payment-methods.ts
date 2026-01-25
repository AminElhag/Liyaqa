"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getMyPaymentMethods,
  getPaymentMethod,
  getDefaultPaymentMethod,
  addPaymentMethod,
  setDefaultPaymentMethod,
  updatePaymentMethod,
  removePaymentMethod,
  hasSavedPaymentMethods,
} from "@/lib/api/payment-methods";
import type {
  PaymentMethod,
  AddPaymentMethodRequest,
  UpdatePaymentMethodRequest,
} from "@/types/payment-method";

// ==================== QUERY KEYS ====================

export const paymentMethodKeys = {
  all: ["payment-methods"] as const,
  list: () => [...paymentMethodKeys.all, "list"] as const,
  detail: (id: string) => [...paymentMethodKeys.all, "detail", id] as const,
  default: () => [...paymentMethodKeys.all, "default"] as const,
  hasSaved: () => [...paymentMethodKeys.all, "has-saved"] as const,
};

// ==================== QUERY HOOKS ====================

/**
 * Fetch all saved payment methods
 */
export function useMyPaymentMethods(
  options?: Omit<UseQueryOptions<PaymentMethod[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: paymentMethodKeys.list(),
    queryFn: getMyPaymentMethods,
    ...options,
  });
}

/**
 * Fetch a specific payment method
 */
export function usePaymentMethod(
  id: string,
  options?: Omit<UseQueryOptions<PaymentMethod>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: paymentMethodKeys.detail(id),
    queryFn: () => getPaymentMethod(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Fetch default payment method
 */
export function useDefaultPaymentMethod(
  options?: Omit<UseQueryOptions<PaymentMethod | null>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: paymentMethodKeys.default(),
    queryFn: getDefaultPaymentMethod,
    ...options,
  });
}

/**
 * Check if member has saved payment methods
 */
export function useHasSavedPaymentMethods(
  options?: Omit<UseQueryOptions<boolean>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: paymentMethodKeys.hasSaved(),
    queryFn: hasSavedPaymentMethods,
    ...options,
  });
}

// ==================== MUTATION HOOKS ====================

/**
 * Add a new payment method
 */
export function useAddPaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddPaymentMethodRequest) => addPaymentMethod(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentMethodKeys.all });
    },
  });
}

/**
 * Set a payment method as default
 */
export function useSetDefaultPaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => setDefaultPaymentMethod(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentMethodKeys.all });
    },
  });
}

/**
 * Update a payment method
 */
export function useUpdatePaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePaymentMethodRequest }) =>
      updatePaymentMethod(id, data),
    onSuccess: (updatedMethod) => {
      queryClient.setQueryData(paymentMethodKeys.detail(updatedMethod.id), updatedMethod);
      queryClient.invalidateQueries({ queryKey: paymentMethodKeys.list() });
    },
  });
}

/**
 * Remove a payment method
 */
export function useRemovePaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => removePaymentMethod(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: paymentMethodKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: paymentMethodKeys.all });
    },
  });
}
