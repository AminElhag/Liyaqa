"use client";

import { useLocale } from "next-intl";
import { User, Mail, Phone, MapPin, Award, Briefcase, Calendar } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loading } from "@/components/ui/spinner";
import { useMyTrainerProfile } from "@/queries/use-trainers";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const locale = useLocale();
  const isRtl = locale === "ar";

  // Fetch trainer profile
  const { data: profile, isLoading, error } = useMyTrainerProfile();

  const texts = {
    title: locale === "ar" ? "الملف الشخصي" : "Profile",
    description:
      locale === "ar"
        ? "عرض معلومات ملفك الشخصي"
        : "View your profile information",
    personalInfo: locale === "ar" ? "المعلومات الشخصية" : "Personal Information",
    professionalInfo:
      locale === "ar" ? "المعلومات المهنية" : "Professional Information",
    contactInfo: locale === "ar" ? "معلومات الاتصال" : "Contact Information",
    fullName: locale === "ar" ? "الاسم الكامل" : "Full Name",
    email: locale === "ar" ? "البريد الإلكتروني" : "Email",
    phone: locale === "ar" ? "الهاتف" : "Phone",
    location: locale === "ar" ? "الموقع" : "Location",
    trainerType: locale === "ar" ? "نوع المدرب" : "Trainer Type",
    status: locale === "ar" ? "الحالة" : "Status",
    specializations: locale === "ar" ? "التخصصات" : "Specializations",
    memberSince: locale === "ar" ? "عضو منذ" : "Member Since",
    bio: locale === "ar" ? "نبذة" : "Bio",
    na: locale === "ar" ? "غير متوفر" : "Not Available",
    error: locale === "ar" ? "حدث خطأ في تحميل الملف الشخصي" : "Error loading profile",
    // Trainer Types
    personalTrainer: locale === "ar" ? "مدرب شخصي" : "Personal Trainer",
    groupFitness: locale === "ar" ? "لياقة جماعية" : "Group Fitness",
    specialist: locale === "ar" ? "متخصص" : "Specialist",
    hybrid: locale === "ar" ? "مختلط" : "Hybrid",
    // Status
    active: locale === "ar" ? "نشط" : "Active",
    inactive: locale === "ar" ? "غير نشط" : "Inactive",
    onLeave: locale === "ar" ? "في إجازة" : "On Leave",
    terminated: locale === "ar" ? "موقوف" : "Terminated",
  };

  const getTrainerTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      PERSONAL_TRAINER: texts.personalTrainer,
      GROUP_FITNESS: texts.groupFitness,
      SPECIALIST: texts.specialist,
      HYBRID: texts.hybrid,
    };
    return labels[type] || type;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      ACTIVE: texts.active,
      INACTIVE: texts.inactive,
      ON_LEAVE: texts.onLeave,
      TERMINATED: texts.terminated,
    };
    return labels[status] || status;
  };

  const getStatusVariant = (status: string): "success" | "secondary" | "warning" | "destructive" => {
    const variants: Record<string, "success" | "secondary" | "warning" | "destructive"> = {
      ACTIVE: "success",
      INACTIVE: "secondary",
      ON_LEAVE: "warning",
      TERMINATED: "destructive",
    };
    return variants[status] || "secondary";
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return texts.na;
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(date);
    } catch {
      return texts.na;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-destructive">{texts.error}</p>
      </div>
    );
  }

  const displayName = locale === "ar"
    ? (profile.displayName?.ar || profile.userName || "Trainer")
    : (profile.displayName?.en || profile.userName || "Trainer");

  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={cn(isRtl && "text-right")}>
        <h1 className="text-3xl font-bold tracking-tight">{texts.title}</h1>
        <p className="text-muted-foreground">{texts.description}</p>
      </div>

      {/* Profile Overview Card */}
      <Card>
        <CardHeader>
          <div
            className={cn(
              "flex items-start gap-4",
              isRtl && "flex-row-reverse"
            )}
          >
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.profileImageUrl || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className={cn("flex-1", isRtl && "text-right")}>
              <CardTitle className="text-2xl">{displayName}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Badge variant={getStatusVariant(profile.status)}>
                  {getStatusLabel(profile.status)}
                </Badge>
                <Badge variant="outline">{getTrainerTypeLabel(profile.trainerType)}</Badge>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {texts.personalInfo}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={cn(isRtl && "text-right")}>
              <p className="text-sm text-muted-foreground">{texts.fullName}</p>
              <p className="font-medium">{displayName}</p>
            </div>
            <div className={cn(isRtl && "text-right")}>
              <p className="text-sm text-muted-foreground">{texts.memberSince}</p>
              <p className="font-medium">
                <Calendar className="h-4 w-4 inline me-1" />
                {formatDate(profile.createdAt)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              {texts.contactInfo}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={cn(isRtl && "text-right")}>
              <p className="text-sm text-muted-foreground">{texts.email}</p>
              <p className="font-medium">{profile.userEmail || texts.na}</p>
            </div>
            <div className={cn(isRtl && "text-right")}>
              <p className="text-sm text-muted-foreground">{texts.phone}</p>
              <p className="font-medium">{profile.phone || texts.na}</p>
            </div>
          </CardContent>
        </Card>

        {/* Professional Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              {texts.professionalInfo}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={cn(isRtl && "text-right")}>
              <p className="text-sm text-muted-foreground mb-2">{texts.specializations}</p>
              <div className="flex flex-wrap gap-2">
                {profile.specializations && profile.specializations.length > 0 ? (
                  profile.specializations.map((spec, index) => (
                    <Badge key={index} variant="secondary">
                      <Award className="h-3 w-3 me-1" />
                      {spec}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground">{texts.na}</span>
                )}
              </div>
            </div>

            {profile.bio && (
              <div className={cn(isRtl && "text-right")}>
                <p className="text-sm text-muted-foreground mb-2">{texts.bio}</p>
                <p className="text-sm">
                  {locale === "ar" ? profile.bio.ar : profile.bio.en}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
