import { useEffect, useState, useCallback, useRef } from "react";

import { fetchPaginatedProfiles } from "@/lib/profile-service";
import { useFilterStore } from "@/store/filter-store";
import { MOCK_PROFILES } from "@/lib/mock-data";

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

interface MockFilterArgs {
  search?: string;

  city?: string;
  département?: string;

  roleType?: string;
  experienceLevel?: string;

  techStack?: string[];

  openToCollaboration?: boolean | null;

  page: number;
  pageSize: number;
}

function filterMockProfiles(
  args: MockFilterArgs
): {
  profiles: Profile[];
  total: number;
} {
  const q = args.search?.toLowerCase();

  const results = MOCK_PROFILES.filter((p) => {
    // Search
    if (q) {
      const match =
        p.full_name.toLowerCase().includes(q) ||
        (p.bio?.toLowerCase().includes(q) ?? false) ||
        p.tech_stack.some((t) =>
          t.toLowerCase().includes(q)
        );

      if (!match) return false;
    }

    // City
    if (args.city && p.city !== args.city) {
      return false;
    }

    // département
    if (
      args.département &&
      p.département !== args.département
    ) {
      return false;
    }

    // Role
    if (
      args.roleType &&
      p.role_type !== args.roleType
    ) {
      return false;
    }

    // Experience
    if (
      args.experienceLevel &&
      p.experience_level !==
        args.experienceLevel
    ) {
      return false;
    }

    // Tech stack
    if (
      args.techStack &&
      args.techStack.length > 0
    ) {
      const hasMatchingTech =
        args.techStack.some((t) =>
          p.tech_stack.includes(t)
        );

      if (!hasMatchingTech) {
        return false;
      }
    }

    // Collaboration
    if (
      args.openToCollaboration != null &&
      p.open_to_collaboration !==
        args.openToCollaboration
    ) {
      return false;
    }

    return true;
  });

  const total = results.length;

  const start =
    (args.page - 1) * args.pageSize;

  return {
    profiles: results.slice(
      start,
      start + args.pageSize
    ),
    total,
  };
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

  const debounceRef = useRef<
    ReturnType<typeof setTimeout> | null
  >(null);

  const {
    searchQuery,
    city,
    département,
    roleType,
    experienceLevel,
    techStack,
    openToCollaboration,
  } = useFilterStore();

  const fetchData = useCallback(async () => {
    setIsLoading(true);

    setError(null);

    const mockArgs: MockFilterArgs = {
      search: searchQuery || undefined,

      city: city || undefined,
      département:
        département || undefined,

      roleType:
        roleType || undefined,

      experienceLevel:
        experienceLevel || undefined,

      techStack:
        techStack.length > 0
          ? techStack
          : undefined,

      openToCollaboration,

      page,
      pageSize,
    };

    try {
      const result =
        await fetchPaginatedProfiles({
          page,
          pageSize,

          search: mockArgs.search,

          city: mockArgs.city,
          département:
            mockArgs.département,
          roleType:
            mockArgs.roleType,

          experienceLevel:
            mockArgs.experienceLevel,

          techStack:
            mockArgs.techStack,

          openToCollaboration,
        });

      if (result.total === 0) {
        const mock =
          filterMockProfiles(mockArgs);

        setProfiles(mock.profiles);

        setTotal(mock.total);
      } else {
        setProfiles(result.profiles);

        setTotal(result.total);
      }
    } catch {
      const mock =
        filterMockProfiles(mockArgs);

      setProfiles(mock.profiles);

      setTotal(mock.total);
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

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current =
      setTimeout(fetchData, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(
          debounceRef.current
        );
      }
    };
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
