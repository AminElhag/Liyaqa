"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Search, Command as CommandIcon, X } from "lucide-react";
import { cn } from "@liyaqa/shared/utils";
import { useCommandPalette } from "./command-palette-provider";
import { CommandItem, CommandGroup } from "./command-item";
import {
  allCommands,
  searchCommands,
  getGroupedCommands,
  categoryLabels,
  type Command,
  type CommandCategory,
} from "@/lib/commands";

export function CommandPalette() {
  const { isOpen, close, recentItems, addToRecent } = useCommandPalette();
  const router = useRouter();
  const locale = useLocale();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  // Get filtered commands based on search query
  const filteredCommands = React.useMemo(() => {
    if (query.trim()) {
      return searchCommands(query, allCommands, locale);
    }
    return [];
  }, [query, locale]);

  // Get recent commands when no search
  const recentCommands = React.useMemo(() => {
    if (query.trim()) return [];
    return recentItems
      .map((id) => allCommands.find((cmd) => cmd.id === id))
      .filter((cmd): cmd is Command => cmd !== undefined)
      .slice(0, 5);
  }, [recentItems, query]);

  // Get default grouped commands when no search
  const groupedCommands = React.useMemo(() => {
    if (query.trim()) return null;
    return getGroupedCommands(allCommands);
  }, [query]);

  // Flat list of visible commands for keyboard navigation
  const visibleCommands = React.useMemo(() => {
    if (query.trim()) {
      return filteredCommands;
    }

    const commands: Command[] = [];
    if (recentCommands.length > 0) {
      commands.push(...recentCommands);
    }
    if (groupedCommands) {
      commands.push(...groupedCommands.actions);
      commands.push(...groupedCommands.pages.slice(0, 8));
    }
    return commands;
  }, [query, filteredCommands, recentCommands, groupedCommands]);

  // Reset selection when results change
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  React.useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      // Small delay to ensure the dialog is rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Handle command execution
  const executeCommand = React.useCallback(
    (command: Command) => {
      addToRecent(command.id);
      close();

      if (command.action) {
        command.action();
      } else if (command.href) {
        router.push(`/${locale}${command.href}`);
      }
    },
    [addToRecent, close, router, locale]
  );

  // Keyboard navigation
  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setSelectedIndex((prev) =>
            prev < visibleCommands.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          event.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case "Enter":
          event.preventDefault();
          if (visibleCommands[selectedIndex]) {
            executeCommand(visibleCommands[selectedIndex]);
          }
          break;
        case "Escape":
          event.preventDefault();
          close();
          break;
      }
    },
    [visibleCommands, selectedIndex, executeCommand, close]
  );

  // Scroll selected item into view
  React.useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.querySelector(
        '[data-selected="true"]'
      );
      selectedElement?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  const isArabic = locale === "ar";
  const showEmptyState = query.trim() && filteredCommands.length === 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="command-palette-backdrop"
        onClick={close}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className="command-palette-container"
        role="dialog"
        aria-modal="true"
        aria-label={isArabic ? "لوحة الأوامر" : "Command palette"}
      >
        <div className="md3-card-outlined overflow-hidden">
          {/* Search input */}
          <div className="flex items-center border-b px-4">
            <Search className="h-5 w-5 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isArabic
                  ? "ابحث عن صفحة أو إجراء..."
                  : "Search for a page or action..."
              }
              className="command-palette-input"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <div className="flex items-center gap-2 text-muted-foreground">
              <kbd className="command-palette-kbd hidden sm:inline-flex">
                ESC
              </kbd>
              <button
                type="button"
                onClick={close}
                className="p-1 hover:bg-muted rounded-md3-sm sm:hidden"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Results */}
          <div
            ref={listRef}
            className="max-h-[400px] overflow-y-auto p-2"
            role="listbox"
          >
            {/* Empty state */}
            {showEmptyState && (
              <div className="py-12 text-center text-muted-foreground">
                <p className="text-sm">
                  {isArabic
                    ? `لا توجد نتائج لـ "${query}"`
                    : `No results for "${query}"`}
                </p>
              </div>
            )}

            {/* Search results */}
            {query.trim() && filteredCommands.length > 0 && (
              <div className="space-y-1">
                {filteredCommands.slice(0, 15).map((command, index) => (
                  <CommandItem
                    key={command.id}
                    command={command}
                    isSelected={index === selectedIndex}
                    locale={locale}
                    onClick={() => executeCommand(command)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  />
                ))}
              </div>
            )}

            {/* Default view (no search) */}
            {!query.trim() && (
              <>
                {/* Recent items */}
                {recentCommands.length > 0 && (
                  <CommandGroup
                    title={isArabic ? categoryLabels.recent.ar : categoryLabels.recent.en}
                  >
                    {recentCommands.map((command, index) => (
                      <CommandItem
                        key={`recent-${command.id}`}
                        command={command}
                        isSelected={index === selectedIndex}
                        locale={locale}
                        onClick={() => executeCommand(command)}
                        onMouseEnter={() => setSelectedIndex(index)}
                      />
                    ))}
                  </CommandGroup>
                )}

                {/* Quick actions */}
                {groupedCommands && groupedCommands.actions.length > 0 && (
                  <CommandGroup
                    title={isArabic ? categoryLabels.actions.ar : categoryLabels.actions.en}
                  >
                    {groupedCommands.actions.map((command, index) => {
                      const actualIndex =
                        recentCommands.length + index;
                      return (
                        <CommandItem
                          key={command.id}
                          command={command}
                          isSelected={actualIndex === selectedIndex}
                          locale={locale}
                          onClick={() => executeCommand(command)}
                          onMouseEnter={() => setSelectedIndex(actualIndex)}
                        />
                      );
                    })}
                  </CommandGroup>
                )}

                {/* Pages */}
                {groupedCommands && groupedCommands.pages.length > 0 && (
                  <CommandGroup
                    title={isArabic ? categoryLabels.pages.ar : categoryLabels.pages.en}
                  >
                    {groupedCommands.pages.slice(0, 8).map((command, index) => {
                      const actualIndex =
                        recentCommands.length +
                        (groupedCommands?.actions.length || 0) +
                        index;
                      return (
                        <CommandItem
                          key={command.id}
                          command={command}
                          isSelected={actualIndex === selectedIndex}
                          locale={locale}
                          onClick={() => executeCommand(command)}
                          onMouseEnter={() => setSelectedIndex(actualIndex)}
                        />
                      );
                    })}
                  </CommandGroup>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="command-palette-kbd">↑↓</kbd>
                {isArabic ? "للتنقل" : "Navigate"}
              </span>
              <span className="flex items-center gap-1">
                <kbd className="command-palette-kbd">↵</kbd>
                {isArabic ? "للتحديد" : "Select"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <CommandIcon className="h-3 w-3" />
              <span>+ K</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
