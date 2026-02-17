// Stub command palette commands
export interface Command {
  id: string;
  label: string;
  category: string;
  action: () => void;
}

export type CommandCategory = "navigation" | "actions" | "settings";

export const allCommands: Command[] = [];
export const searchCommands = (query: string) => allCommands;
export const getGroupedCommands = (_commands?: Command[]) => ({ actions: [] as Command[], pages: [] as Command[] });
export const categoryLabels: Record<CommandCategory, string> = {
  navigation: "Navigation",
  actions: "Actions",
  settings: "Settings"
};
