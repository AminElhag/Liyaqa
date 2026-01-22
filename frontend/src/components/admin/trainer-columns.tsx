"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Eye, Edit, CheckCircle, XCircle, Briefcase, Power, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TrainerStatusBadge } from "./trainer-status-badge";
import { TrainerTypeBadge } from "./trainer-type-badge";
import { getLocalizedText } from "@/lib/utils";
import type { TrainerSummary } from "@/types/trainer";

interface TrainerColumnsOptions {
  locale: string;
  onView: (trainer: TrainerSummary) => void;
  onEdit: (trainer: TrainerSummary) => void;
  onActivate: (trainer: TrainerSummary) => void;
  onDeactivate: (trainer: TrainerSummary) => void;
  onSetOnLeave: (trainer: TrainerSummary) => void;
  canEdit?: boolean;
  /** ID of the trainer that currently has a pending action */
  pendingTrainerId?: string | null;
}

export function getTrainerColumns(options: TrainerColumnsOptions): ColumnDef<TrainerSummary>[] {
  const { locale, onView, onEdit, onActivate, onDeactivate, onSetOnLeave, canEdit = true, pendingTrainerId } = options;

  const texts = {
    name: locale === "ar" ? "الاسم" : "Name",
    type: locale === "ar" ? "النوع" : "Type",
    specializations: locale === "ar" ? "التخصصات" : "Specializations",
    status: locale === "ar" ? "الحالة" : "Status",
    actions: locale === "ar" ? "الإجراءات" : "Actions",
    view: locale === "ar" ? "عرض" : "View",
    edit: locale === "ar" ? "تعديل" : "Edit",
    activate: locale === "ar" ? "تفعيل" : "Activate",
    deactivate: locale === "ar" ? "إلغاء التفعيل" : "Deactivate",
    setOnLeave: locale === "ar" ? "إجازة" : "Set On Leave",
    na: locale === "ar" ? "غير محدد" : "N/A",
    noSpecializations: locale === "ar" ? "لا توجد تخصصات" : "No specializations",
  };

  return [
    {
      accessorKey: "displayName",
      header: texts.name,
      cell: ({ row }) => {
        const name = getLocalizedText(row.original.displayName, locale) || texts.na;
        const initials = name.slice(0, 2).toUpperCase();

        return (
          <div className="flex items-center gap-3 max-w-[250px]">
            <Avatar className="h-10 w-10">
              <AvatarImage src={row.original.profileImageUrl || undefined} alt={name} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium truncate">{name}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "trainerType",
      header: texts.type,
      cell: ({ row }) => <TrainerTypeBadge type={row.original.trainerType} />,
    },
    {
      accessorKey: "specializations",
      header: texts.specializations,
      cell: ({ row }) => {
        const specs = row.original.specializations || [];
        if (specs.length === 0) {
          return <span className="text-sm text-muted-foreground">{texts.noSpecializations}</span>;
        }
        return (
          <div className="flex flex-wrap gap-1 max-w-[200px]">
            {specs.slice(0, 2).map((spec, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-muted"
              >
                {spec}
              </span>
            ))}
            {specs.length > 2 && (
              <span className="text-xs text-muted-foreground">+{specs.length - 2}</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: texts.status,
      cell: ({ row }) => <TrainerStatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: texts.actions,
      cell: ({ row }) => {
        const trainer = row.original;
        const canActivate = trainer.status === "INACTIVE" || trainer.status === "ON_LEAVE";
        const canDeactivate = trainer.status === "ACTIVE";
        const canSetOnLeave = trainer.status === "ACTIVE";
        const isPendingForThisTrainer = pendingTrainerId === trainer.id;
        const isAnyPending = pendingTrainerId !== null && pendingTrainerId !== undefined;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={isAnyPending}>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                {isPendingForThisTrainer ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MoreHorizontal className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={locale === "ar" ? "start" : "end"}>
              <DropdownMenuLabel>{texts.actions}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onView(trainer)}>
                <Eye className="me-2 h-4 w-4" />
                {texts.view}
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem onClick={() => onEdit(trainer)}>
                  <Edit className="me-2 h-4 w-4" />
                  {texts.edit}
                </DropdownMenuItem>
              )}
              {canEdit && (canActivate || canDeactivate || canSetOnLeave) && (
                <>
                  <DropdownMenuSeparator />
                  {canActivate && (
                    <DropdownMenuItem onClick={() => onActivate(trainer)}>
                      <CheckCircle className="me-2 h-4 w-4" />
                      {texts.activate}
                    </DropdownMenuItem>
                  )}
                  {canSetOnLeave && (
                    <DropdownMenuItem onClick={() => onSetOnLeave(trainer)}>
                      <Briefcase className="me-2 h-4 w-4" />
                      {texts.setOnLeave}
                    </DropdownMenuItem>
                  )}
                  {canDeactivate && (
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => onDeactivate(trainer)}
                    >
                      <Power className="me-2 h-4 w-4" />
                      {texts.deactivate}
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
