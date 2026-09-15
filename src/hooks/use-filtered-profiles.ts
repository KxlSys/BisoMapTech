import { useEffect, useState, useCallback } from "react";

import { fetchPaginatedProfiles } from "@/lib/profile-service";
import { useFilterStore } from "@/store/filter-store";

import type { Profile } from "@/types";

interface UseFilteredProfilesOptions {
  pageSize?: number;
}

interface UseFilteredProfilesResult {
  profiles: Profile[];

  isLoading: boolean;
  error: string | null;

  total: number;

  page: number;
  totalPages: number;

  setPage: (page: number) => void;

  refetch: () => void;
}

export function useFilteredProfiles(
  options: UseFilteredProfilesOptions = {}
): UseFilteredProfilesResult {
  const { pageSize = 24 } = options;

  const [profiles, setProfiles] = useState<
    Profile[]
  >([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] = useState<
    string | null
  >(null);

  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);

  const {
    searchQuery,
    city,
    département,
    roleType,
    experienceLevel,
    techStack,
    openToCollaboration,
    sortBy,
  } = useFilterStore();

  const fetchData = useCallback(async () => {
    setIsLoading(true);

    setError(null);

    const queryArgs = {
      search: searchQuery || undefined,
      city: city || undefined,
      département: département || undefined,
      roleType: roleType || undefined,
      experienceLevel: experienceLevel || undefined,
      techStack: techStack.length > 0 ? techStack : undefined,
      openToCollaboration,
      page,
      pageSize,
    };

    try {
      const result = await fetchPaginatedProfiles({
        page,
        pageSize,
        search: queryArgs.search,
        city: queryArgs.city,
        département: queryArgs.département,
        roleType: queryArgs.roleType,
        experienceLevel: queryArgs.experienceLevel,
        techStack: queryArgs.techStack,
        openToCollaboration,
      });

      const sorted = [...result.profiles];
      if (sortBy === "available_first") {
        sorted.sort((a, b) => {
          if (a.open_to_collaboration === b.open_to_collaboration) return 0;
          return a.open_to_collaboration ? -1 : 1;
        });
      } else if (sortBy === "recent") {
        sorted.sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
      }

      setProfiles(sorted);
      setTotal(result.total);
    } catch (err) {
      // Une base injoignable ne doit pas être maquillée en annuaire peuplé :
      // on remonte l'erreur, l'appelant affiche un état explicite.
      console.error("Chargement des profils impossible:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger les contributeurs."
      );
      setProfiles([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [
    page,
    pageSize,

    searchQuery,
    city,
    département,

    roleType,
    experienceLevel,

    techStack,

    openToCollaboration,
    sortBy,
  ]);

  useEffect(() => {
    setPage(1);
  }, [
    searchQuery,
    city,
    département,

    roleType,
    experienceLevel,

    techStack,

    openToCollaboration,
  ]);

  // ⚡ Bolt: Remove redundant 300ms setTimeout debounce wrapper around fetchData.
  // The `searchQuery` is controlled by a DebouncedInput component, meaning state updates
  // are already debounced. Removing this wrapper eliminates "double debouncing" for text
  // search and prevents unnecessary latency when interacting with other immediate filters.
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    profiles,

    isLoading,
    error,

    total,

    page,

    totalPages: Math.ceil(
      total / pageSize
    ),

    setPage,

    refetch: fetchData,
  };
}
