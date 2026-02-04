"use client";

import { useLocale } from "next-intl";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import type { NoteCategory } from "@liyaqa/shared/types/platform/client-note";
import { getNoteCategoryLabel, getNoteCategoryColor } from "@liyaqa/shared/types/platform/client-note";

interface NoteCategoryBadgeProps {
  category: NoteCategory;
}

const colorClasses: Record<string, string> = {
  slate: "bg-slate-100 text-slate-700 border-slate-200",
  blue: "bg-blue-100 text-blue-700 border-blue-200",
  emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
  purple: "bg-purple-100 text-purple-700 border-purple-200",
  amber: "bg-amber-100 text-amber-700 border-amber-200",
};

export function NoteCategoryBadge({ category }: NoteCategoryBadgeProps) {
  const locale = useLocale();
  const color = getNoteCategoryColor(category);
  const label = getNoteCategoryLabel(category, locale);

  return (
    <Badge variant="outline" className={colorClasses[color] || colorClasses.slate}>
      {label}
    </Badge>
  );
}
