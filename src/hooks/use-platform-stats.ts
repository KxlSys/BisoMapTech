import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { MOCK_PROFILES } from "@/lib/mock-data";

export interface PlatformStats {
  totalUsers: number;
  totalCities: number;
  collaborationRate: number;
  techCount: number;
}

// ⚡ Bolt: Consolidated multiple array passes (.map.filter, .filter, .flatMap) into a single O(n) loop
function computeStats(
  profiles: Array<{ city?: string | null; open_to_collaboration?: boolean | null; tech_stack?: string[] | null }>
): PlatformStats {
  const total = profiles.length;
  if (total === 0) return { totalUsers: 0, totalCities: 0, collaborationRate: 0, techCount: 0 };

  let collab = 0;
  const citiesSet = new Set<string>();
  const techsSet = new Set<string>();

  for (const p of profiles) {
    if (p.open_to_collaboration) {
      collab++;
    }
    if (p.city) {
      citiesSet.add(p.city);
    }
    if (p.tech_stack) {
      for (const tech of p.tech_stack) {
        techsSet.add(tech);
      }
    }
  }

  return {
    totalUsers: total,
    totalCities: citiesSet.size,
    collaborationRate: Math.round((collab / total) * 100),
    techCount: techsSet.size,
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
