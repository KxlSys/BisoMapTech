import { create } from "zustand";

export type SortBy = "default" | "available_first" | "recent";

interface FilterState {
  searchQuery: string;
  city: string;
  département: string;
  techStack: string[];
  roleType: string;
  experienceLevel: string;
  openToCollaboration: boolean | null;
  sortBy: SortBy;
  setSearchQuery: (query: string) => void;
  setCity: (city: string) => void;
  setDépartement: (département: string) => void;
  setTechStack: (stack: string[]) => void;
  setRoleType: (role: string) => void;
  setExperienceLevel: (level: string) => void;
  setOpenToCollaboration: (open: boolean | null) => void;
  setSortBy: (sort: SortBy) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  searchQuery: "",
  city: "",
  département: "",
  techStack: [],
  roleType: "",
  experienceLevel: "",
  openToCollaboration: null,
  sortBy: "default",
  setSearchQuery: (query) => set({ searchQuery: query }),
  setCity: (city) => set({ city }),
  setDépartement: (département) => set({ département }),
  setTechStack: (stack) => set({ techStack: stack }),
  setRoleType: (role) => set({ roleType: role }),
  setExperienceLevel: (level) => set({ experienceLevel: level }),
  setOpenToCollaboration: (open) => set({ openToCollaboration: open }),
  setSortBy: (sort) => set({ sortBy: sort }),
  resetFilters: () =>
    set({
      searchQuery: "",
      city: "",
      département: "",
      techStack: [],
      roleType: "",
      experienceLevel: "",
      openToCollaboration: null,
      sortBy: "default",
    }),
}));
