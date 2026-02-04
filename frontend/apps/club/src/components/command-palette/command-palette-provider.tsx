"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

interface CommandPaletteContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  recentItems: string[];
  addToRecent: (id: string) => void;
}

const CommandPaletteContext = React.createContext<CommandPaletteContextValue | null>(null);

const RECENT_ITEMS_KEY = "liyaqa-command-palette-recent";
const MAX_RECENT_ITEMS = 10;

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [recentItems, setRecentItems] = React.useState<string[]>([]);
  const router = useRouter();
  const locale = useLocale();

  // Load recent items from localStorage on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_ITEMS_KEY);
      if (stored) {
        setRecentItems(JSON.parse(stored));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Save recent items to localStorage
  const saveRecentItems = React.useCallback((items: string[]) => {
    try {
      localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(items));
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const open = React.useCallback(() => setIsOpen(true), []);
  const close = React.useCallback(() => setIsOpen(false), []);
  const toggle = React.useCallback(() => setIsOpen((prev) => !prev), []);

  const addToRecent = React.useCallback(
    (id: string) => {
      setRecentItems((prev) => {
        // Remove if already exists, then add to front
        const filtered = prev.filter((item) => item !== id);
        const updated = [id, ...filtered].slice(0, MAX_RECENT_ITEMS);
        saveRecentItems(updated);
        return updated;
      });
    },
    [saveRecentItems]
  );

  // Global keyboard shortcut: Cmd/Ctrl + K
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd/Ctrl + K to toggle
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        toggle();
      }

      // Escape to close
      if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        close();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, toggle, close]);

  // Prevent body scroll when open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const value = React.useMemo(
    () => ({
      isOpen,
      open,
      close,
      toggle,
      recentItems,
      addToRecent,
    }),
    [isOpen, open, close, toggle, recentItems, addToRecent]
  );

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPalette() {
  const context = React.useContext(CommandPaletteContext);
  if (!context) {
    throw new Error("useCommandPalette must be used within a CommandPaletteProvider");
  }
  return context;
}

/**
 * Safe version that returns null when outside provider context.
 * Use this in components that may render outside the CommandPaletteProvider.
 */
export function useCommandPaletteSafe() {
  return React.useContext(CommandPaletteContext);
}
