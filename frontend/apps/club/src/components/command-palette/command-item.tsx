"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { Command } from "@/lib/commands";

interface CommandItemProps {
  command: Command;
  isSelected: boolean;
  locale: string;
  onClick: () => void;
  onMouseEnter: () => void;
}

export function CommandItem({
  command,
  isSelected,
  locale,
  onClick,
  onMouseEnter,
}: CommandItemProps) {
  const Icon = command.icon;
  const isArabic = locale === "ar";

  return (
    <button
      type="button"
      className={cn(
        "command-palette-item w-full text-start",
        isSelected && "bg-primary/10"
      )}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      data-selected={isSelected}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-md3-md",
          "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-foreground truncate">
          {isArabic ? command.titleAr : command.title}
        </div>
        {(command.description || command.descriptionAr) && (
          <div className="text-sm text-muted-foreground truncate">
            {isArabic ? command.descriptionAr : command.description}
          </div>
        )}
      </div>
      {command.shortcut && (
        <kbd className="command-palette-kbd hidden sm:inline-flex">
          {command.shortcut}
        </kbd>
      )}
    </button>
  );
}

interface CommandGroupProps {
  title: string;
  children: React.ReactNode;
}

export function CommandGroup({ title, children }: CommandGroupProps) {
  return (
    <div className="py-2">
      <div className="command-palette-group">{title}</div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
