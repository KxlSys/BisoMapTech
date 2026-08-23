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

  // ⚡ Bolt: Consolidate data aggregation into a single O(n) pass
  // Avoids multiple redundant iterations and intermediate array allocations
  const citySet = new Set<string>();
  const techSet = new Set<string>();
  let collab = 0;

  for (let i = 0; i < total; i++) {
    const p = profiles[i];
    if (p.city) citySet.add(p.city);
    if (p.open_to_collaboration) collab++;
    if (p.tech_stack) {
      for (let j = 0; j < p.tech_stack.length; j++) {
        techSet.add(p.tech_stack[j]);
      }
    }
  }

  return {
    totalUsers: total,
    totalCities: citySet.size,
    collaborationRate: Math.round((collab / total) * 100),
    techCount: techSet.size,
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
