"use client";

import { useState, useEffect } from "react";

/**
 * Hook that debounces a value by the specified delay.
 * Useful for search inputs to prevent excessive API calls.
 *
 * @param value - The value to debounce
 * @param delay - The debounce delay in milliseconds (default: 300ms)
 * @returns The debounced value
 *
 * @example
 * ```tsx
 * const [search, setSearch] = useState("");
 * const debouncedSearch = useDebouncedValue(search, 300);
 *
 * // Use debouncedSearch in your API call
 * const { data } = useQuery({
 *   queryKey: ["items", debouncedSearch],
 *   queryFn: () => fetchItems(debouncedSearch),
 * });
 * ```
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook that returns a debounced callback function.
 * The callback will only execute after the specified delay has passed
 * without the function being called again.
 *
 * @param callback - The callback function to debounce
 * @param delay - The debounce delay in milliseconds (default: 300ms)
 * @returns The debounced callback
 *
 * @example
 * ```tsx
 * const debouncedSearch = useDebouncedCallback((term: string) => {
 *   // This will only run after 300ms of no calls
 *   fetchResults(term);
 * }, 300);
 * ```
 */
export function useDebouncedCallback<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delay: number = 300
): T {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const debouncedCallback = ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const newTimeoutId = setTimeout(() => {
      callback(...args);
    }, delay);

    setTimeoutId(newTimeoutId);
  }) as T;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return debouncedCallback;
}
