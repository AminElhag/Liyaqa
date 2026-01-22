"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Command } from "cmdk";
import {
  Building2,
  Handshake,
  CreditCard,
  Receipt,
  Users,
  LayoutDashboard,
  Settings,
  Search,
  Plus,
  Ticket,
  Moon,
  Sun,
  Monitor,
  LogOut,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface PlatformCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CommandItem {
  id: string;
  labelEn: string;
  labelAr: string;
  icon: React.ElementType;
  shortcut?: string;
  action: () => void;
  group: "navigation" | "actions" | "theme" | "account";
}

export function PlatformCommandPalette({ open, onOpenChange }: PlatformCommandPaletteProps) {
  const router = useRouter();
  const locale = useLocale();
  const isRtl = locale === "ar";
  const { setTheme, theme } = useTheme();
  const [search, setSearch] = React.useState("");

  const texts = {
    placeholder: locale === "ar" ? "ابحث عن أمر..." : "Search commands...",
    noResults: locale === "ar" ? "لا توجد نتائج" : "No results found.",
    navigation: locale === "ar" ? "التنقل" : "Navigation",
    actions: locale === "ar" ? "الإجراءات" : "Quick Actions",
    theme: locale === "ar" ? "المظهر" : "Theme",
    account: locale === "ar" ? "الحساب" : "Account",
  };

  const navigate = React.useCallback(
    (path: string) => {
      router.push(`/${locale}${path}`);
      onOpenChange(false);
    },
    [router, locale, onOpenChange]
  );

  const commands: CommandItem[] = React.useMemo(
    () => [
      // Navigation
      {
        id: "dashboard",
        labelEn: "Go to Dashboard",
        labelAr: "الذهاب إلى لوحة التحكم",
        icon: LayoutDashboard,
        shortcut: "G D",
        action: () => navigate("/platform-dashboard"),
        group: "navigation",
      },
      {
        id: "clients",
        labelEn: "Go to Clients",
        labelAr: "الذهاب إلى العملاء",
        icon: Building2,
        shortcut: "G C",
        action: () => navigate("/clients"),
        group: "navigation",
      },
      {
        id: "deals",
        labelEn: "Go to Deals",
        labelAr: "الذهاب إلى الصفقات",
        icon: Handshake,
        shortcut: "G D",
        action: () => navigate("/deals"),
        group: "navigation",
      },
      {
        id: "subscriptions",
        labelEn: "Go to Subscriptions",
        labelAr: "الذهاب إلى الاشتراكات",
        icon: CreditCard,
        shortcut: "G S",
        action: () => navigate("/client-subscriptions"),
        group: "navigation",
      },
      {
        id: "invoices",
        labelEn: "Go to Invoices",
        labelAr: "الذهاب إلى الفواتير",
        icon: Receipt,
        shortcut: "G I",
        action: () => navigate("/client-invoices"),
        group: "navigation",
      },
      {
        id: "support",
        labelEn: "Go to Support",
        labelAr: "الذهاب إلى الدعم",
        icon: Ticket,
        shortcut: "G T",
        action: () => navigate("/support"),
        group: "navigation",
      },
      {
        id: "users",
        labelEn: "Go to Team",
        labelAr: "الذهاب إلى الفريق",
        icon: Users,
        shortcut: "G U",
        action: () => navigate("/platform-users"),
        group: "navigation",
      },
      {
        id: "settings",
        labelEn: "Go to Settings",
        labelAr: "الذهاب إلى الإعدادات",
        icon: Settings,
        shortcut: "G ,",
        action: () => navigate("/settings"),
        group: "navigation",
      },

      // Quick Actions
      {
        id: "new-client",
        labelEn: "Create New Client",
        labelAr: "إنشاء عميل جديد",
        icon: Plus,
        shortcut: "N C",
        action: () => navigate("/clients/new"),
        group: "actions",
      },
      {
        id: "new-deal",
        labelEn: "Create New Deal",
        labelAr: "إنشاء صفقة جديدة",
        icon: Plus,
        shortcut: "N D",
        action: () => navigate("/deals/new"),
        group: "actions",
      },
      {
        id: "new-subscription",
        labelEn: "Create New Subscription",
        labelAr: "إنشاء اشتراك جديد",
        icon: Plus,
        shortcut: "N S",
        action: () => navigate("/client-subscriptions/new"),
        group: "actions",
      },
      {
        id: "new-ticket",
        labelEn: "Create Support Ticket",
        labelAr: "إنشاء تذكرة دعم",
        icon: Plus,
        shortcut: "N T",
        action: () => navigate("/support/new"),
        group: "actions",
      },

      // Theme
      {
        id: "theme-light",
        labelEn: "Light Mode",
        labelAr: "الوضع الفاتح",
        icon: Sun,
        action: () => {
          setTheme("light");
          onOpenChange(false);
        },
        group: "theme",
      },
      {
        id: "theme-dark",
        labelEn: "Dark Mode",
        labelAr: "الوضع الداكن",
        icon: Moon,
        action: () => {
          setTheme("dark");
          onOpenChange(false);
        },
        group: "theme",
      },
      {
        id: "theme-system",
        labelEn: "System Theme",
        labelAr: "حسب النظام",
        icon: Monitor,
        action: () => {
          setTheme("system");
          onOpenChange(false);
        },
        group: "theme",
      },

      // Account
      {
        id: "logout",
        labelEn: "Sign Out",
        labelAr: "تسجيل الخروج",
        icon: LogOut,
        action: () => navigate("/platform-login"),
        group: "account",
      },
    ],
    [navigate, setTheme, onOpenChange]
  );

  // Close on Escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  const groupedCommands = {
    navigation: commands.filter((c) => c.group === "navigation"),
    actions: commands.filter((c) => c.group === "actions"),
    theme: commands.filter((c) => c.group === "theme"),
    account: commands.filter((c) => c.group === "account"),
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in-0"
        onClick={() => onOpenChange(false)}
      />

      {/* Command Dialog */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
        <Command
          className={cn(
            "w-full max-w-lg rounded-xl border bg-popover shadow-2xl animate-in slide-in-from-top-2 fade-in-0 duration-200",
            "dark:border-neutral-800"
          )}
          shouldFilter={true}
        >
          {/* Search Input */}
          <div className={cn("flex items-center border-b px-4 dark:border-neutral-800", isRtl && "flex-row-reverse")}>
            <Search className={cn("h-4 w-4 text-muted-foreground shrink-0", isRtl ? "ml-3" : "mr-3")} />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder={texts.placeholder}
              className={cn(
                "flex-1 h-12 bg-transparent outline-none placeholder:text-muted-foreground text-sm",
                isRtl && "text-right"
              )}
            />
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ESC
            </kbd>
          </div>

          {/* Command List */}
          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              {texts.noResults}
            </Command.Empty>

            {/* Navigation */}
            {groupedCommands.navigation.length > 0 && (
              <Command.Group
                heading={texts.navigation}
                className={cn("text-xs font-medium text-muted-foreground px-2 py-1.5", isRtl && "text-right")}
              >
                {groupedCommands.navigation.map((item) => (
                  <CommandItemRow key={item.id} item={item} locale={locale} isRtl={isRtl} />
                ))}
              </Command.Group>
            )}

            {/* Quick Actions */}
            {groupedCommands.actions.length > 0 && (
              <Command.Group
                heading={texts.actions}
                className={cn("text-xs font-medium text-muted-foreground px-2 py-1.5", isRtl && "text-right")}
              >
                {groupedCommands.actions.map((item) => (
                  <CommandItemRow key={item.id} item={item} locale={locale} isRtl={isRtl} />
                ))}
              </Command.Group>
            )}

            {/* Theme */}
            {groupedCommands.theme.length > 0 && (
              <Command.Group
                heading={texts.theme}
                className={cn("text-xs font-medium text-muted-foreground px-2 py-1.5", isRtl && "text-right")}
              >
                {groupedCommands.theme.map((item) => (
                  <CommandItemRow key={item.id} item={item} locale={locale} isRtl={isRtl} />
                ))}
              </Command.Group>
            )}

            {/* Account */}
            {groupedCommands.account.length > 0 && (
              <Command.Group
                heading={texts.account}
                className={cn("text-xs font-medium text-muted-foreground px-2 py-1.5", isRtl && "text-right")}
              >
                {groupedCommands.account.map((item) => (
                  <CommandItemRow key={item.id} item={item} locale={locale} isRtl={isRtl} />
                ))}
              </Command.Group>
            )}
          </Command.List>

          {/* Footer */}
          <div
            className={cn(
              "flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground dark:border-neutral-800",
              isRtl && "flex-row-reverse"
            )}
          >
            <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
              <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                ↵
              </kbd>
              <span>{locale === "ar" ? "للتنفيذ" : "to select"}</span>
            </div>
            <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
              <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                ↑↓
              </kbd>
              <span>{locale === "ar" ? "للتنقل" : "to navigate"}</span>
            </div>
          </div>
        </Command>
      </div>
    </>
  );
}

interface CommandItemRowProps {
  item: CommandItem;
  locale: string;
  isRtl: boolean;
}

function CommandItemRow({ item, locale, isRtl }: CommandItemRowProps) {
  const Icon = item.icon;
  const label = locale === "ar" ? item.labelAr : item.labelEn;

  return (
    <Command.Item
      value={`${item.labelEn} ${item.labelAr}`}
      onSelect={item.action}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer",
        "data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground",
        "transition-colors",
        isRtl && "flex-row-reverse"
      )}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
        <Icon className="h-4 w-4" />
      </div>
      <span className={cn("flex-1 text-sm", isRtl && "text-right")}>{label}</span>
      {item.shortcut && (
        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          {item.shortcut}
        </kbd>
      )}
    </Command.Item>
  );
}

// Hook for using the command palette
export function useCommandPalette() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { open, setOpen };
}
