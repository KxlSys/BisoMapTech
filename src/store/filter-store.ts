import { create } from "zustand";

interface FilterState {
  searchQuery: string;
  city: string;
  département: string;
  techStack: string[];
  roleType: string;
  experienceLevel: string;
  openToCollaboration: boolean | null;
  setSearchQuery: (query: string) => void;
  setCity: (city: string) => void;
  setDépartement: (département: string) => void;
  setTechStack: (stack: string[]) => void;
  setRoleType: (role: string) => void;
  setExperienceLevel: (level: string) => void;
  setOpenToCollaboration: (open: boolean | null) => void;
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
  setSearchQuery: (query) => set({ searchQuery: query }),
  setCity: (city) => set({ city }),
  setDépartement: (département) => set({ département }),
  setTechStack: (stack) => set({ techStack: stack }),
  setRoleType: (role) => set({ roleType: role }),
  setExperienceLevel: (level) => set({ experienceLevel: level }),
  setOpenToCollaboration: (open) => set({ openToCollaboration: open }),
  resetFilters: () =>
    set({
      searchQuery: "",
      city: "",
      département: "",
      techStack: [],
      roleType: "",
      experienceLevel: "",
      openToCollaboration: null,
    }),
}));
