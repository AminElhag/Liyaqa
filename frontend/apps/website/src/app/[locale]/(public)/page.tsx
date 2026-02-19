"use client";

import {
  HeroSection,
  SaudiFeatures,
  PlatformFeatures,
  HowItWorks,
  PricingPreview,
  CtaSection,
} from "@/components/landing";

/**
 * Main landing page for Liyaqa - the gym management platform
 * built specifically for Saudi Arabia and GCC markets.
 *
 * Sections are ordered for optimal conversion:
 * 1. Hero - Immediate value proposition and CTAs
 * 2. Saudi Features - Differentiators for local market
 * 3. Platform Features - Full capabilities showcase
 * 4. How It Works - Reduce friction by showing simplicity
 * 5. Pricing Preview - Transparency and clear next step
 * 6. CTA - Final conversion push
 */
export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <SaudiFeatures />
      <PlatformFeatures />
      <HowItWorks />
      <PricingPreview />
      <CtaSection />
    </>
  );
}
