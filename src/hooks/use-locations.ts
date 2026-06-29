import { useEffect, useState } from "react";

import { getCities, getDepartments } from "@/lib/location-service";
import { CONGO_CITIES } from "@/lib/cities";
import { département_OPTIONS } from "@/lib/constants";

import type { CityCoordinates } from "@/types";

interface UseLocationsResult {
  cities: CityCoordinates[];
  departments: string[];
  isLoading: boolean;
}

/**
 * Charge villes et départements depuis Supabase, avec repli sur les
 * constantes statiques si les tables sont absentes, vides ou en erreur.
 */
// ⚡ Bolt: Cache location data at module level to prevent redundant Supabase calls
let cachedCities: CityCoordinates[] | null = null;
let cachedDepartments: string[] | null = null;
let fetchPromise: Promise<[CityCoordinates[], string[]]> | null = null;

export function useLocations(): UseLocationsResult {
  const [cities, setCities] = useState<CityCoordinates[]>(
    cachedCities ?? CONGO_CITIES
  );
  const [departments, setDepartments] = useState<string[]>(
    cachedDepartments ?? département_OPTIONS
  );
  // ⚡ Bolt: Immediately set isLoading to false if data is already cached
  const [isLoading, setIsLoading] = useState(!cachedCities || !cachedDepartments);

  useEffect(() => {
    // ⚡ Bolt: If data is already cached, no need to fetch again
    if (cachedCities && cachedDepartments) {
      return;
    }

    let active = true;

    if (!fetchPromise) {
      fetchPromise = Promise.all([getCities(), getDepartments()]);
    }

    fetchPromise
      .then(([dbCities, dbDepartments]) => {
        if (dbCities.length > 0) cachedCities = dbCities;
        if (dbDepartments.length > 0) cachedDepartments = dbDepartments;

        if (!active) return;

        if (cachedCities) setCities(cachedCities);
        if (cachedDepartments) setDepartments(cachedDepartments);
      })
      .catch(() => {
        // On conserve les valeurs statiques de repli.
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { cities, departments, isLoading };
}
