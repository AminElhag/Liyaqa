"use client";

import { useLocale } from "next-intl";
import { User, Award, Clock } from "lucide-react";
import { Card, CardContent } from "@liyaqa/shared/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@liyaqa/shared/components/ui/avatar";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Button } from "@liyaqa/shared/components/ui/button";
import { TrainerTypeBadge } from "@/components/admin/trainer-type-badge";
import { getLocalizedText } from "@liyaqa/shared/utils";
import type { TrainerSummary } from "@liyaqa/shared/types/trainer";

interface TrainerListProps {
  trainers: TrainerSummary[];
  onSelectTrainer: (trainer: TrainerSummary) => void;
}

export function TrainerList({ trainers, onSelectTrainer }: TrainerListProps) {
  const locale = useLocale();

  const texts = {
    viewProfile: locale === "ar" ? "عرض الملف الشخصي" : "View Profile",
    book: locale === "ar" ? "احجز الآن" : "Book Now",
    specializations: locale === "ar" ? "التخصصات" : "Specializations",
    noTrainers: locale === "ar" ? "لا يوجد مدربين متاحين" : "No trainers available",
  };

  if (!trainers || trainers.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        {texts.noTrainers}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {trainers.map((trainer) => {
        const name = getLocalizedText(trainer.displayName, locale) || "Trainer";
        const initials = name.slice(0, 2).toUpperCase();

        return (
          <Card
            key={trainer.id}
            className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onSelectTrainer(trainer)}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={trainer.profileImageUrl || undefined} alt={name} />
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate">{name}</h3>
                  <div className="mt-1">
                    <TrainerTypeBadge type={trainer.trainerType} />
                  </div>
                </div>
              </div>

              {trainer.specializations && trainer.specializations.length > 0 && (
                <div className="mt-4">
                  <div className="flex flex-wrap gap-1">
                    {trainer.specializations.slice(0, 3).map((spec, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {spec}
                      </Badge>
                    ))}
                    {trainer.specializations.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{trainer.specializations.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t">
                <Button className="w-full" onClick={() => onSelectTrainer(trainer)}>
                  {texts.book}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
