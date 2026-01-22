"use client";

import { Camera, Mail, Phone } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { LocalizedText } from "@/components/ui/localized-text";
import type { Member } from "@/types/member";

interface MemberProfileHeroProps {
  member: Member;
  onPhotoUpload: () => void;
  locale: string;
}

export function MemberProfileHero({
  member,
  onPhotoUpload,
  locale,
}: MemberProfileHeroProps) {
  const initials =
    (member.firstName.en?.[0] || "") + (member.lastName.en?.[0] || "");

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary to-sky-600 p-6 md:p-8">
      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6 md:flex-row md:items-start">
        {/* Avatar with photo upload */}
        <div className="relative group shrink-0">
          <Avatar className="h-28 w-28 ring-4 ring-white/20 shadow-xl">
            <AvatarImage alt={`${member.firstName.en} ${member.lastName.en}`} />
            <AvatarFallback className="text-3xl font-bold bg-white/10 text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={onPhotoUpload}
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            aria-label={locale === "ar" ? "تحميل صورة" : "Upload photo"}
          >
            <Camera className="h-6 w-6 text-white" />
          </button>
        </div>

        {/* Member info */}
        <div className="flex-1 text-center md:text-start">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            <LocalizedText text={member.firstName} />{" "}
            <LocalizedText text={member.lastName} />
          </h1>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-3 md:justify-start">
            <StatusBadge
              status={member.status}
              locale={locale}
              className="bg-white/20 text-white border-white/30"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm md:justify-start">
            <div className="flex items-center gap-1.5 text-white/80">
              <Mail className="h-4 w-4" />
              <span>{member.email}</span>
            </div>
            {member.phone && (
              <>
                <span className="hidden text-white/40 md:inline">|</span>
                <div className="flex items-center gap-1.5 text-white/80">
                  <Phone className="h-4 w-4" />
                  <span>{member.phone}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
