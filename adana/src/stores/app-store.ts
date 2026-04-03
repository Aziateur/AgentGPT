"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User, ProjectView, Theme } from "@/types";

interface AppState {
  // State
  currentUser: User | null;
  sidebarCollapsed: boolean;
  theme: Theme;
  searchQuery: string;
  selectedProjectView: ProjectView;

  // Actions
  setCurrentUser: (user: User | null) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setSearchQuery: (query: string) => void;
  setProjectView: (view: ProjectView) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      currentUser: null,
      sidebarCollapsed: false,
      theme: "light",
      searchQuery: "",
      selectedProjectView: "list",

      // Actions
      setCurrentUser: (user) => set({ currentUser: user }),

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarCollapsed: (collapsed) =>
        set({ sidebarCollapsed: collapsed }),

      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === "light" ? "dark" : "light",
        })),

      setTheme: (theme) => set({ theme }),

      setSearchQuery: (query) => set({ searchQuery: query }),

      setProjectView: (view) => set({ selectedProjectView: view }),
    }),
    {
      name: "adana-app-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        selectedProjectView: state.selectedProjectView,
      }),
    }
  )
);
