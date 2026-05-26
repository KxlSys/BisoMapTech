import { supabase } from "@/lib/supabase";
import type { Place } from "@/types";

function sanitizeSearchTerm(value: string): string {
  return value
    .trim()
    .slice(0, 60)
    .replace(/[(),]/g, " ")
    .replace(/[%_]/g, " ")
    .replace(/\s+/g, " ");
}

export async function fetchPaginatedPlaces(params: {
  page: number;
  pageSize: number;
  search?: string;
  city?: string;
  category?: string;
}): Promise<{ places: Place[]; total: number }> {
  const { page, pageSize, search, city, category } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("places")
    .select("id,name,category,city,address,latitude,longitude,phone,whatsapp,website,status,created_at", { count: "exact" })
    .eq("status", "approved");

  if (search) {
    const safeSearch = sanitizeSearchTerm(search);
    if (safeSearch) {
      query = query.or(
        `name.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%,address.ilike.%${safeSearch}%,city.ilike.%${safeSearch}%`
      );
    }
  }

  if (city && city !== "all") query = query.eq("city", city);
  if (category && category !== "all") query = query.eq("category", category);

  const { data, count, error } = await query
    .order("name", { ascending: true })
    .range(from, to);

  if (error) throw error;
  return { places: (data ?? []) as Place[], total: count ?? 0 };
}

export async function fetchPendingPlaces(): Promise<Place[]> {
  const { data, error } = await supabase
    .from("places")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Place[];
}

export type CreatePlaceInput = {
  name: string;
  category: string;
  description: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  whatsapp: string;
  website: string;
  created_by: string;
};

export async function createPlace(input: CreatePlaceInput): Promise<string> {
  const { data, error } = await supabase
    .from("places")
    .insert({
      ...input,
      status: "pending",
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function approvePlace(placeId: string, approvedBy: string): Promise<void> {
  const { error } = await supabase
    .from("places")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: approvedBy,
      updated_at: new Date().toISOString(),
    })
    .eq("id", placeId);
  if (error) throw error;
}

export async function rejectPlace(placeId: string): Promise<void> {
  const { error } = await supabase
    .from("places")
    .update({
      status: "rejected",
      updated_at: new Date().toISOString(),
    })
    .eq("id", placeId);
  if (error) throw error;
}
