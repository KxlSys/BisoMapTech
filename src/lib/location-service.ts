import { supabase } from "@/lib/supabase";
import type { CityCoordinates, Department } from "@/types";

interface CityRow {
  name: string;
  latitude: number;
  longitude: number;
  departments: { name: string } | null;
}

export async function getDepartments(): Promise<string[]> {
  const { data, error } = await supabase
    .from("departments")
    .select("name")
    .order("name", { ascending: true });

  if (error) {
    console.error("Erreur chargement départements:", error);
    return [];
  }

  return (data ?? []).map((d) => d.name as string);
}

export async function getCities(): Promise<CityCoordinates[]> {
  const { data, error } = await supabase
    .from("cities")
    .select("name, latitude, longitude, departments ( name )")
    .order("name", { ascending: true });

  if (error) {
    console.error("Erreur chargement villes:", error);
    return [];
  }

  return ((data ?? []) as unknown as CityRow[]).map((city) => ({
    name: city.name,
    département: (city.departments?.name ?? "") as Department,
    latitude: city.latitude,
    longitude: city.longitude,
  }));
}
