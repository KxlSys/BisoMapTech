import type {
  CityCoordinates,
} from "@/types";

export const CONGO_CITIES: CityCoordinates[] = [
  {
    name: "Brazzaville",
    département: "Brazzaville",
    latitude: -4.2634,
    longitude: 15.2429,
  },

  {
    name: "Pointe-Noire",
    département: "Pointe-Noire",
    latitude: -4.7889,
    longitude: 11.8653,
  },

  {
    name: "Dolisie",
    département: "Niari",
    latitude: -4.1995,
    longitude: 12.6667,
  },

  {
    name: "Nkayi",
    département: "Bouenza",
    latitude: -4.1842,
    longitude: 13.2883,
  },

  {
    name: "Ouesso",
    département: "Sangha",
    latitude: 1.6136,
    longitude: 16.0517,
  },

  {
    name: "Mossendjo",
    département: "Niari",
    latitude: -2.9453,
    longitude: 12.7156,
  },

  {
    name: "Sibiti",
    département: "Lékoumou",
    latitude: -3.6833,
    longitude: 13.35,
  },

  {
    name: "Loubomo",
    département: "Niari",
    latitude: -4.1833,
    longitude: 12.6667,
  },

  {
    name: "Madingou",
    département: "Bouenza",
    latitude: -4.155,
    longitude: 13.55,
  },

  {
    name: "Impfondo",
    département: "Likouala",
    latitude: 1.6186,
    longitude: 18.0622,
  },

  {
    name: "Owando",
    département: "Cuvette",
    latitude: -0.4819,
    longitude: 15.9,
  },

  {
    name: "Gamboma",
    département: "Plateaux",
    latitude: -1.8764,
    longitude: 15.8644,
  },

  {
    name: "Oyo",
    département: "Cuvette",
    latitude: -1.1333,
    longitude: 15.9667,
  },

  {
    name: "Boundji",
    département: "Cuvette",
    latitude: -1.0797,
    longitude: 15.3772,
  },

  {
    name: "Makoua",
    département: "Cuvette",
    latitude: 0.0069,
    longitude: 15.6333,
  },

  {
    name: "Ewo",
    département: "Cuvette-Ouest",
    latitude: -0.8719,
    longitude: 14.8203,
  },

  {
    name: "Kindamba",
    département: "Pool",
    latitude: -3.95,
    longitude: 14.75,
  },

  {
    name: "Kinkala",
    département: "Pool",
    latitude: -4.3614,
    longitude: 14.7644,
  },

  {
    name: "Djambala",
    département: "Plateaux",
    latitude: -2.54,
    longitude: 14.7519,
  },

  {
    name: "Loandjili",
    département: "Pointe-Noire",
    latitude: -4.7578,
    longitude: 11.8578,
  },

  {
    name: "Mossaka",
    département: "Cuvette",
    latitude: -1.2233,
    longitude: 16.7894,
  },

  {
    name: "Moyoundzi",
    département: "Bouenza",
    latitude: -3.5156,
    longitude: 13.6761,
  },

  {
    name: "Sembé",
    département: "Sangha",
    latitude: 1.6464,
    longitude: 14.58,
  },

  {
    name: "Souanké",
    département: "Sangha",
    latitude: 2.0624,
    longitude: 14.1399,
  },

  {
    name: "Zanaga",
    département: "Lékoumou",
    latitude: -2.8656,
    longitude: 13.825,
  },

  {
    name: "Odziba",
    département: "Djoué-Léfini",
    latitude: -4.5167,
    longitude: 14.9,
  },
];

export const CITY_OPTIONS = CONGO_CITIES.map(
  (city) => city.name
);

export function getCityCoordinates(
  cityName: string
): CityCoordinates | undefined {
  return CONGO_CITIES.find(
    (city) =>
      city.name.toLowerCase() ===
      cityName.toLowerCase()
  );
}