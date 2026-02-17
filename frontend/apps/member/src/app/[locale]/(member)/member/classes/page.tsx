"use client";

import { useState, useMemo } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { Search, Clock, Users, Filter, Calendar as CalendarIcon } from "lucide-react";
import { Card, CardContent } from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { LocalizedText } from "@liyaqa/shared/components/ui/localized-text";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { useMemberClasses } from "@liyaqa/shared/queries";
import type { GymClass, ClassPricingModel } from "@liyaqa/shared/types/scheduling";
import { cn } from "@liyaqa/shared/utils";

// Class types and difficulty levels
const CLASS_TYPES = [
  "GROUP_FITNESS",
  "PERSONAL_TRAINING",
  "SPECIALTY",
  "WORKSHOP",
] as const;

const DIFFICULTY_LEVELS = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "ALL_LEVELS",
] as const;

const texts = {
  en: {
    title: "Classes",
    subtitle: "Discover and book classes",
    search: "Search classes...",
    filterByType: "Class Type",
    filterByDifficulty: "Difficulty",
    all: "All",
    viewTimetable: "View Timetable",
    noClasses: "No classes found",
    noClassesDesc: "Try adjusting your filters",
    minutes: "min",
    capacity: "capacity",
    // Class types
    GROUP_FITNESS: "Group Fitness",
    PERSONAL_TRAINING: "Personal Training",
    SPECIALTY: "Specialty",
    WORKSHOP: "Workshop",
    // Difficulty levels
    BEGINNER: "Beginner",
    INTERMEDIATE: "Intermediate",
    ADVANCED: "Advanced",
    ALL_LEVELS: "All Levels",
    // Pricing models
    INCLUDED_IN_MEMBERSHIP: "Included",
    PAY_PER_ENTRY: "Pay per entry",
    CLASS_PACK_ONLY: "Class pack",
    HYBRID: "Multiple options",
    viewSchedule: "View Schedule",
  },
  ar: {
    title: "الحصص",
    subtitle: "اكتشف واحجز الحصص",
    search: "البحث في الحصص...",
    filterByType: "نوع الحصة",
    filterByDifficulty: "المستوى",
    all: "الكل",
    viewTimetable: "عرض الجدول",
    noClasses: "لا توجد حصص",
    noClassesDesc: "جرب تعديل الفلاتر",
    minutes: "دقيقة",
    capacity: "السعة",
    // Class types
    GROUP_FITNESS: "لياقة جماعية",
    PERSONAL_TRAINING: "تدريب شخصي",
    SPECIALTY: "متخصص",
    WORKSHOP: "ورشة عمل",
    // Difficulty levels
    BEGINNER: "مبتدئ",
    INTERMEDIATE: "متوسط",
    ADVANCED: "متقدم",
    ALL_LEVELS: "جميع المستويات",
    // Pricing models
    INCLUDED_IN_MEMBERSHIP: "مضمّن",
    PAY_PER_ENTRY: "دفع لكل حصة",
    CLASS_PACK_ONLY: "باقة حصص",
    HYBRID: "خيارات متعددة",
    viewSchedule: "عرض الجدول",
  },
};

function getPricingBadgeColor(pricingModel: ClassPricingModel) {
  switch (pricingModel) {
    case "INCLUDED_IN_MEMBERSHIP":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    case "PAY_PER_ENTRY":
      return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    case "CLASS_PACK_ONLY":
      return "bg-purple-500/10 text-purple-600 border-purple-500/20";
    case "HYBRID":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    default:
      return "";
  }
}

function getDifficultyBadgeColor(level: string) {
  switch (level) {
    case "BEGINNER":
      return "bg-green-500/10 text-green-600 border-green-500/20";
    case "INTERMEDIATE":
      return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    case "ADVANCED":
      return "bg-red-500/10 text-red-600 border-red-500/20";
    case "ALL_LEVELS":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    default:
      return "";
  }
}

interface ClassCardProps {
  gymClass: GymClass;
  locale: string;
  onClick: () => void;
}

function ClassCard({ gymClass, locale, onClick }: ClassCardProps) {
  const t = texts[locale as "en" | "ar"] || texts.en;

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden group"
      onClick={onClick}
    >
      {/* Color bar */}
      <div
        className="h-2"
        style={{
          backgroundColor: gymClass.colorCode || "#6366f1",
        }}
      />
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Class name */}
          <h3 className="font-semibold group-hover:text-primary transition-colors">
            <LocalizedText text={gymClass.name} />
          </h3>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={cn("text-xs", getDifficultyBadgeColor(gymClass.difficultyLevel))}
            >
              {t[gymClass.difficultyLevel as keyof typeof t] || gymClass.difficultyLevel}
            </Badge>
            <Badge
              variant="outline"
              className={cn("text-xs", getPricingBadgeColor(gymClass.pricingModel))}
            >
              {t[gymClass.pricingModel as keyof typeof t] || gymClass.pricingModel}
            </Badge>
          </div>

          {/* Meta info */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {gymClass.durationMinutes} {t.minutes}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {gymClass.capacity}
            </span>
          </div>

          {/* Trainer name */}
          {gymClass.trainerName && (
            <p className="text-sm text-muted-foreground">
              <LocalizedText text={gymClass.trainerName} />
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function MemberClassesPage() {
  const locale = useLocale() as "en" | "ar";
  const t = texts[locale];

  const [searchQuery, setSearchQuery] = useState("");
  const [classType, setClassType] = useState<string>("ALL");
  const [difficultyLevel, setDifficultyLevel] = useState<string>("ALL");
  const [page, setPage] = useState(0);

  // Fetch classes
  const { data, isLoading, error } = useMemberClasses({
    page,
    size: 20,
    classType: classType !== "ALL" ? classType : undefined,
    difficultyLevel: difficultyLevel !== "ALL" ? difficultyLevel : undefined,
  });

  // Filter by search query (client-side)
  const filteredClasses = useMemo(() => {
    const classes = data?.content || [];
    if (!searchQuery.trim()) return classes;

    const query = searchQuery.toLowerCase();
    return classes.filter((gymClass) => {
      const nameEn = gymClass.name.en?.toLowerCase() || "";
      const nameAr = gymClass.name.ar?.toLowerCase() || "";
      const descEn = gymClass.description?.en?.toLowerCase() || "";
      const descAr = gymClass.description?.ar?.toLowerCase() || "";
      return (
        nameEn.includes(query) ||
        nameAr.includes(query) ||
        descEn.includes(query) ||
        descAr.includes(query)
      );
    });
  }, [data?.content, searchQuery]);

  const handleClassClick = (gymClass: GymClass) => {
    // For now, navigate to timetable filtered by this class
    window.location.href = `/${locale}/member/classes/timetable?classId=${gymClass.id}`;
  };

  if (error) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-destructive">
          {locale === "ar" ? "حدث خطأ" : "Error loading classes"}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/${locale}/member/classes/timetable`}>
            <CalendarIcon className="h-4 w-4 me-2" />
            {t.viewTimetable}
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Class Type Filter */}
            <Select
              value={classType}
              onValueChange={(value) => {
                setClassType(value);
                setPage(0);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 me-2 text-muted-foreground" />
                <SelectValue placeholder={t.filterByType} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t.all}</SelectItem>
                {CLASS_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t[type as keyof typeof t] || type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Difficulty Filter */}
            <Select
              value={difficultyLevel}
              onValueChange={(value) => {
                setDifficultyLevel(value);
                setPage(0);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={t.filterByDifficulty} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t.all}</SelectItem>
                {DIFFICULTY_LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>
                    {t[level as keyof typeof t] || level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Classes Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loading />
        </div>
      ) : filteredClasses.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <CalendarIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">{t.noClasses}</h3>
            <p className="text-muted-foreground mt-1">{t.noClassesDesc}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredClasses.map((gymClass) => (
              <ClassCard
                key={gymClass.id}
                gymClass={gymClass}
                locale={locale}
                onClick={() => handleClassClick(gymClass)}
              />
            ))}
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                {locale === "ar" ? "→" : "←"}
              </Button>
              <span className="text-sm text-muted-foreground">
                {page + 1} / {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))}
                disabled={page >= data.totalPages - 1}
              >
                {locale === "ar" ? "←" : "→"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
