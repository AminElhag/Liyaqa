"use client";

import {
  HeroSection,
  TrustBar,
  SaudiFeatures,
  PlatformFeatures,
  HowItWorks,
  StatsSection,
  Testimonials,
  PricingPreview,
  CtaSection,
} from "@/components/landing";

/**
 * Main landing page for Liyaqa - the gym management platform
 * built specifically for Saudi Arabia and GCC markets.
 *
 * Sections are ordered for optimal conversion:
 * 1. Hero - Immediate value proposition and CTAs
 * 2. Trust Bar - Social proof via client logos
 * 3. Saudi Features - Differentiators for local market
 * 4. Platform Features - Full capabilities showcase
 * 5. How It Works - Reduce friction by showing simplicity
 * 6. Stats - Build credibility with numbers
 * 7. Testimonials - Social proof from real customers
 * 8. Pricing Preview - Transparency and clear next step
 * 9. CTA - Final conversion push
 */
export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <TrustBar />
      <SaudiFeatures />
      <PlatformFeatures />
      <HowItWorks />
      <StatsSection />
      <Testimonials />
      <PricingPreview />
      <CtaSection />
    </>
  );
}
