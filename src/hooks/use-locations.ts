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
export function useLocations(): UseLocationsResult {
  const [cities, setCities] = useState<CityCoordinates[]>(CONGO_CITIES);
  const [departments, setDepartments] = useState<string[]>(département_OPTIONS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    Promise.all([getCities(), getDepartments()])
      .then(([dbCities, dbDepartments]) => {
        if (!active) return;
        if (dbCities.length > 0) setCities(dbCities);
        if (dbDepartments.length > 0) setDepartments(dbDepartments);
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
