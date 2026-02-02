import { Badge } from "@/components/ui/badge";
import { LEAD_SOURCE_LABELS, type LeadSource } from "@/types/lead";
import { useLocale } from "next-intl";
import {
  Users,
  Footprints,
  Share2,
  DollarSign,
  Globe,
  Phone,
  Mail,
  Handshake,
  Calendar,
  MoreHorizontal,
} from "lucide-react";

interface LeadSourceBadgeProps {
  source: LeadSource;
  className?: string;
  showIcon?: boolean;
}

const SOURCE_ICONS: Record<LeadSource, React.ComponentType<{ className?: string }>> = {
  REFERRAL: Users,
  WALK_IN: Footprints,
  SOCIAL_MEDIA: Share2,
  PAID_ADS: DollarSign,
  WEBSITE: Globe,
  PHONE_CALL: Phone,
  EMAIL: Mail,
  PARTNER: Handshake,
  EVENT: Calendar,
  OTHER: MoreHorizontal,
};

export function LeadSourceBadge({ source, className, showIcon = true }: LeadSourceBadgeProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const label = LEAD_SOURCE_LABELS[source];
  const Icon = SOURCE_ICONS[source];

  return (
    <Badge variant="outline" className={className}>
      {showIcon && <Icon className="h-3 w-3 me-1" />}
      {isArabic ? label.ar : label.en}
    </Badge>
  );
}
