"use client";

import { useLocale } from "next-intl";
import { Award, Clock, Mail, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@liyaqa/shared/components/ui/avatar";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Separator } from "@liyaqa/shared/components/ui/separator";
import { TrainerTypeBadge } from "@/components/admin/trainer-type-badge";
import { getLocalizedText } from "@liyaqa/shared/utils";
import type { Trainer } from "@liyaqa/shared/types/trainer";

interface TrainerProfileCardProps {
  trainer: Trainer;
}

export function TrainerProfileCard({ trainer }: TrainerProfileCardProps) {
  const locale = useLocale();

  const texts = {
    bio: locale === "ar" ? "السيرة الذاتية" : "Bio",
    specializations: locale === "ar" ? "التخصصات" : "Specializations",
    certifications: locale === "ar" ? "الشهادات" : "Certifications",
    experience: locale === "ar" ? "سنوات الخبرة" : "Years of Experience",
    ptRate: locale === "ar" ? "سعر الجلسة" : "Session Rate",
    years: locale === "ar" ? "سنوات" : "years",
    perSession: locale === "ar" ? "للجلسة" : "per session",
    noBio: locale === "ar" ? "لا توجد سيرة ذاتية" : "No bio available",
    noSpecializations: locale === "ar" ? "لا توجد تخصصات" : "No specializations",
    noCertifications: locale === "ar" ? "لا توجد شهادات" : "No certifications",
  };

  const name = getLocalizedText(trainer.displayName, locale) || "Trainer";
  const initials = name.slice(0, 2).toUpperCase();
  const bio = getLocalizedText(trainer.bio, locale);

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={trainer.profileImageUrl || undefined} alt={name} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{name}</h2>
              <div className="mt-2">
                <TrainerTypeBadge type={trainer.trainerType} showIcon />
              </div>
              {trainer.experienceYears && (
                <div className="flex items-center gap-2 mt-3 justify-center sm:justify-start">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {trainer.experienceYears} {texts.years} {texts.experience.toLowerCase()}
                  </span>
                </div>
              )}
              {trainer.ptSessionRate && (
                <div className="mt-2">
                  <span className="text-lg font-bold text-primary">
                    {trainer.ptSessionRate} SAR
                  </span>
                  <span className="text-sm text-muted-foreground ms-1">{texts.perSession}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bio */}
      {bio && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{texts.bio}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{bio}</p>
          </CardContent>
        </Card>
      )}

      {/* Specializations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{texts.specializations}</CardTitle>
        </CardHeader>
        <CardContent>
          {trainer.specializations && trainer.specializations.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {trainer.specializations.map((spec, i) => (
                <Badge key={i} variant="secondary">
                  {spec}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">{texts.noSpecializations}</p>
          )}
        </CardContent>
      </Card>

      {/* Certifications */}
      {trainer.certifications && trainer.certifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{texts.certifications}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trainer.certifications.map((cert, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="font-medium">{cert.name}</p>
                    {cert.issuedBy && (
                      <p className="text-sm text-muted-foreground">{cert.issuedBy}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
