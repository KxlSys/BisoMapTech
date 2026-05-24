import type { CityCoordinates } from "@/types";

export const CONGO_CITIES: CityCoordinates[] = [
  { name: "Brazzaville", latitude: -4.2634, longitude: 15.2429 },
  { name: "Pointe-Noire", latitude: -4.7692, longitude: 11.8664 },
  { name: "Dolisie", latitude: -4.1986, longitude: 12.6666 },
  { name: "Nkayi", latitude: -4.1667, longitude: 13.2833 },
  { name: "Owando", latitude: -0.4833, longitude: 15.9 },
  { name: "Ouesso", latitude: 1.6142, longitude: 16.0517 },
  { name: "Impfondo", latitude: 1.6181, longitude: 18.0597 },
  { name: "Sibiti", latitude: -3.6833, longitude: 13.35 },
  { name: "Madingou", latitude: -4.1536, longitude: 13.55 },
  { name: "Kinkala", latitude: -4.3614, longitude: 14.7644 },
  { name: "Mossendjo", latitude: -2.95, longitude: 12.7 },
  { name: "Gamboma", latitude: -1.8764, longitude: 15.8644 },
  { name: "Djambala", latitude: -2.5444, longitude: 14.7531 },
  { name: "Ewo", latitude: -0.8719, longitude: 14.8203 },
  { name: "Makoua", latitude: -0.0083, longitude: 15.6333 },
];

export function getCityCoordinates(
  cityName: string
): CityCoordinates | undefined {
  return CONGO_CITIES.find(
    (c) => c.name.toLowerCase() === cityName.toLowerCase()
  );
}
