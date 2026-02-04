"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  captureUtmParams,
  getUtmParamsForForm,
  type UtmParams,
} from "../lib/utils/utm-capture";

/**
 * Hook to capture and provide UTM parameters
 *
 * Automatically captures UTM params from URL on mount and stores them.
 * Returns the combined params from URL and storage.
 *
 * @example
 * ```tsx
 * const { utmParams, hasUtm } = useUtmParams();
 *
 * // Use in form defaults
 * const form = useForm({
 *   defaultValues: {
 *     campaignSource: utmParams.campaignSource,
 *     campaignMedium: utmParams.campaignMedium,
 *     campaignName: utmParams.campaignName,
 *   },
 * });
 * ```
 */
export function useUtmParams() {
  const searchParams = useSearchParams();
  const [utmParams, setUtmParams] = useState<UtmParams>({});
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Capture UTM params from URL and store them
    const params = captureUtmParams(searchParams);
    setUtmParams(params);
    setIsInitialized(true);
  }, [searchParams]);

  const hasUtm = !!(
    utmParams.campaignSource ||
    utmParams.campaignMedium ||
    utmParams.campaignName
  );

  return {
    /**
     * The captured UTM parameters
     */
    utmParams,
    /**
     * Whether any UTM parameters are present
     */
    hasUtm,
    /**
     * Whether the hook has finished initializing
     */
    isInitialized,
    /**
     * Get UTM params ready for form submission
     * This always gets the freshest combination of URL + stored params
     */
    getFormParams: () => getUtmParamsForForm(searchParams),
  };
}
