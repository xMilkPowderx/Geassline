import { create } from "zustand";

export type AppLogLevel = "info" | "success" | "error";

export type AppLogEntry = {
  id: string;
  at: number;
  level: AppLogLevel;
  text: string;
};

type AppLogState = {
  entries: AppLogEntry[];
  unread: number;
  open: boolean;
  push: (level: AppLogLevel, text: string) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
};

const MAX = 200;

export const useAppLog = create<AppLogState>((set) => ({
  entries: [],
  unread: 0,
  open: false,
  push: (level, text) => {
    const item: AppLogEntry = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      at: Date.now(),
      level,
      text,
    };
    set((s) => ({
      entries: [item, ...s.entries].slice(0, MAX),
      unread: s.open ? 0 : s.unread + 1,
    }));
  },
  clear: () => set({ entries: [], unread: 0 }),
  setOpen: (open) => set((s) => ({ open, unread: open ? 0 : s.unread })),
}));
