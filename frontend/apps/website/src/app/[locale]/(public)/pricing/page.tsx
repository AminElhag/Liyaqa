"use client";

import { useState } from "react";
import {
  PricingHero,
  PricingCards,
  ComparisonTable,
  IncludedSection,
  AddonsSection,
  FaqSection,
} from "../../../../components/pricing";

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <>
      <PricingHero isAnnual={isAnnual} onToggle={setIsAnnual} />
      <PricingCards isAnnual={isAnnual} />
      <ComparisonTable />
      <IncludedSection />
      <AddonsSection />
      <FaqSection />
    </>
  );
}
