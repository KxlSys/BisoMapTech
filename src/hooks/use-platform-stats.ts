import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { MOCK_PROFILES } from "@/lib/mock-data";

export interface PlatformStats {
  totalUsers: number;
  totalCities: number;
  collaborationRate: number;
  techCount: number;
}

function computeStats(
  profiles: Array<{ city?: string | null; open_to_collaboration?: boolean | null; tech_stack?: string[] | null }>
): PlatformStats {
  const total = profiles.length;
  if (total === 0) return { totalUsers: 0, totalCities: 0, collaborationRate: 0, techCount: 0 };
  const cities = new Set(profiles.map((p) => p.city).filter(Boolean)).size;
  const collab = profiles.filter((p) => p.open_to_collaboration).length;
  const allTechs = new Set(profiles.flatMap((p) => p.tech_stack ?? [])).size;
  return {
    totalUsers: total,
    totalCities: cities,
    collaborationRate: Math.round((collab / total) * 100),
    techCount: allTechs,
  };
}

const MOCK_STATS = computeStats(MOCK_PROFILES);

export function usePlatformStats() {
  const [stats, setStats] = useState<PlatformStats>(MOCK_STATS);

  useEffect(() => {
    async function fetchStats() {
      const { data } = await supabase
        .from("profiles")
        .select("city, open_to_collaboration, tech_stack");

      if (!data || data.length === 0) return;
      setStats(computeStats(data));
    }
    fetchStats();
  }, []);

  return stats;
}
