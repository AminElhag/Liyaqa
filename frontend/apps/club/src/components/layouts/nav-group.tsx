"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { cn } from "@liyaqa/shared/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@liyaqa/shared/components/ui/collapsible";

export interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ElementType;
}

export interface NavGroupConfig {
  id: string;
  labelKey: string;
  icon: React.ElementType;
  items: NavItem[];
  defaultExpanded?: boolean;
}

interface NavGroupProps {
  group: NavGroupConfig;
  isExpanded: boolean;
  onToggle: () => void;
  isCollapsed: boolean;
  onCloseMobile?: () => void;
}

export function NavGroup({
  group,
  isExpanded,
  onToggle,
  isCollapsed,
  onCloseMobile,
}: NavGroupProps) {
  const t = useTranslations("nav");
  const tGroups = useTranslations("navGroups");
  const locale = useLocale();
  const pathname = usePathname();

  const GroupIcon = group.icon;

  // Check if any item in this group is active
  const isGroupActive = group.items.some((item) => {
    const localePath = `/${locale}${item.href}`;
    return pathname === localePath || pathname.startsWith(`${localePath}/`);
  });

  // Check if a specific nav item is active
  const isItemActive = (href: string) => {
    const localePath = `/${locale}${href}`;
    return pathname === localePath || pathname.startsWith(`${localePath}/`);
  };

  // When sidebar is collapsed, render a simpler version
  if (isCollapsed) {
    return (
      <div className="relative group">
        <button
          className={cn(
            "flex w-full items-center justify-center p-2 rounded-lg transition-colors",
            isGroupActive
              ? "bg-primary/20 text-primary"
              : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
          )}
          title={tGroups(group.id)}
        >
          <GroupIcon className="h-5 w-5" />
        </button>
        {/* Tooltip flyout on hover */}
        <div className="absolute start-full top-0 ms-2 hidden group-hover:block z-50">
          <div className="bg-neutral-800 rounded-lg shadow-lg border border-neutral-700 py-2 min-w-[180px]">
            <div className="px-3 py-1.5 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
              {tGroups(group.id)}
            </div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={`/${locale}${item.href}`}
                  onClick={onCloseMobile}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-primary text-white"
                      : "text-neutral-300 hover:bg-neutral-700 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{t(item.labelKey)}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            "flex w-full items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all",
            isGroupActive
              ? "bg-primary/15 border-s-[3px] border-primary text-white"
              : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
          )}
        >
          <span className="flex items-center gap-3">
            <GroupIcon className="h-5 w-5 shrink-0" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">{tGroups(group.id)}</span>
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-neutral-500 transition-transform duration-200",
              isExpanded && "rotate-180"
            )}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        <div className="ms-4 mt-1 space-y-0.5 border-s border-neutral-700 ps-3">
          {group.items.map((item, index) => {
            const Icon = item.icon;
            const active = isItemActive(item.href);
            return (
              <Link
                key={item.href}
                href={`/${locale}${item.href}`}
                onClick={onCloseMobile}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                  active
                    ? "bg-primary text-white font-medium"
                    : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
                )}
                style={{
                  animationDelay: `${index * 30}ms`,
                }}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
