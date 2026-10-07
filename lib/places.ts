import { calculateDigitalHealthScore } from "./lead-score";
import { gradeLead, type LeadGrade } from "./lead-quality";

const photonUrl = "https://photon.komoot.io/api/";
const overpassUrl = "https://overpass-api.de/api/interpreter";
const userAgent = "B2BLeadFinder/0.1";
const cacheTtl = 5 * 60 * 1000;
const searchCache = new Map<string, { expiresAt: number; leads: FoundLead[] }>();

type PhotonResponse = {
  features?: Array<{
    geometry?: { coordinates?: [number, number] };
    properties?: {
      name?: string;
      city?: string;
      extent?: [number, number, number, number];
    };
  }>;
};

type OverpassElement = {
  type: string;
  id: number;
  tags?: Record<string, string>;
};

type OverpassResponse = { elements?: OverpassElement[] };
type TagFilter = readonly [string, string];

export type FoundLead = {
  placeId: string;
  businessName: string;
  phone: string | null;
  email: string | null;
  leadGrade: LeadGrade;
  address: string;
  website: string | null;
  rating: number | null;
  reviewCount: number;
  digitalHealthScore: number;
};

export class PlacesError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const categoryRules: Array<{ terms: string[]; filters: TagFilter[] }> = [
  { terms: ["tandarts", "tandheel", "dentist", "orthodont"], filters: [["amenity", "dentist"], ["healthcare", "dentist"]] },
  { terms: ["fysiotherap", "physio"], filters: [["healthcare", "physiotherapist"]] },
  { terms: ["huisarts", "dokter", "doctor", "clinic", "kliniek"], filters: [["amenity", "doctors"], ["amenity", "clinic"], ["healthcare", "doctor"]] },
  { terms: ["restaurant", "eetcafe", "lunchroom"], filters: [["amenity", "restaurant"]] },
  { terms: ["cafe", "koffie", "coffee"], filters: [["amenity", "cafe"]] },
  { terms: ["kapper", "hairdresser", "barber"], filters: [["shop", "hairdresser"]] },
  { terms: ["schoonheid", "beauty", "nagel", "nail salon"], filters: [["shop", "beauty"], ["craft", "beautician"]] },
  { terms: ["loodgieter", "plumber"], filters: [["craft", "plumber"]] },
  { terms: ["elektricien", "electrician"], filters: [["craft", "electrician"]] },
  { terms: ["accountant", "boekhouder"], filters: [["office", "accountant"]] },
  { terms: ["advocaat", "lawyer"], filters: [["office", "lawyer"]] },
  { terms: ["makelaar", "real estate", "estate agent"], filters: [["office", "estate_agent"]] },
  { terms: ["marketing", "reclame", "advertising"], filters: [["office", "advertising_agency"]] },
  { terms: ["consultant", "consultancy", "adviesbureau"], filters: [["office", "consulting"]] },
  { terms: ["architect"], filters: [["office", "architect"]] },
  { terms: ["verzekeraar", "insurance"], filters: [["office", "insurance"]] },
  { terms: ["sportschool", "gym", "fitness"], filters: [["leisure", "fitness_centre"]] },
  { terms: ["dierenarts", "veterinary", "vet"], filters: [["amenity", "veterinary"]] },
  { terms: ["apotheek", "pharmacy"], filters: [["amenity", "pharmacy"]] },
  { terms: ["garage", "autogarage", "car repair", "mechanic"], filters: [["shop", "car_repair"]] },
  { terms: ["hotel"], filters: [["tourism", "hotel"]] },
  { terms: ["installateur", "contractor", "aannemer"], filters: [["craft", "building_contractor"]] },
];

function normalizeText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("nl");
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeOverpassString(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

function getTagFilters(niche: string): TagFilter[] {
  const normalizedNiche = normalizeText(niche);
  const filters = new Map<string, TagFilter>();
  for (const rule of categoryRules) {
    if (rule.terms.some((term) => normalizedNiche.includes(normalizeText(term)))) {
      for (const filter of rule.filters) filters.set(filter.join("="), filter);
    }
  }
  return [...filters.values()];
}

function getBoundingBox(feature: NonNullable<PhotonResponse["features"]>[number]) {
  const extent = feature.properties?.extent;
  let west: number;
  let south: number;
  let east: number;
  let north: number;

  if (extent?.length === 4) {
    [west, north, east, south] = extent;
  } else if (feature.geometry?.coordinates?.length === 2) {
    const [longitude, latitude] = feature.geometry.coordinates;
    const longitudeRadius = 0.06 / Math.max(Math.cos((latitude * Math.PI) / 180), 0.2);
    west = longitude - longitudeRadius;
    east = longitude + longitudeRadius;
    south = latitude - 0.06;
    north = latitude + 0.06;
  } else {
    throw new PlacesError("Deze locatie heeft geen bruikbaar zoekgebied. Kies een plaats of stad.", 422);
  }

  if (![west, south, east, north].every(Number.isFinite) || west >= east || south >= north) {
    throw new PlacesError("De locatie heeft geen geldig zoekgebied. Kies een andere plaats.", 422);
  }
  if (east - west > 0.75 || north - south > 0.75) {
    throw new PlacesError("Zoek per stad of plaats, niet op een hele provincie of land.", 422);
  }

  return [south, west, north, east].join(",");
}

function normalizeWebsite(value?: string) {
  if (!value?.trim()) return null;
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function normalizeEmail(value?: string) {
  const email = value?.trim();
  return email && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

function mapElement(element: OverpassElement, city: string, categoryFilters: TagFilter[]): FoundLead | null {
  const tags = element.tags;
  const businessName = tags?.name?.trim();
  if (!tags || !businessName) return null;

  const street = [tags["addr:street"], tags["addr:housenumber"]].filter(Boolean).join(" ");
  const address = tags["addr:full"] || [
    street,
    tags["addr:postcode"],
    tags["addr:city"] || tags["addr:place"] || city,
  ].filter(Boolean).join(", ");
  const phone = tags["contact:phone"] || tags.phone || tags.mobile || null;
  const email = normalizeEmail(tags["contact:email"] || tags.email);
  const website = normalizeWebsite(tags["contact:website"] || tags.website);
  const leadGrade = gradeLead({
    exactCategoryMatch: categoryFilters.some(([key, value]) => tags[key] === value),
    hasPhone: Boolean(phone),
    hasEmail: Boolean(email),
    hasWebsite: Boolean(website),
  });
  const signals = { website, rating: null, reviewCount: 0, phone };

  return {
    placeId: `osm:${element.type}:${element.id}`,
    businessName,
    phone,
    email,
    leadGrade,
    address: address || "Adres niet beschikbaar",
    website,
    rating: null,
    reviewCount: 0,
    digitalHealthScore: calculateDigitalHealthScore(signals),
  };
}

function getCachedLeads(cacheKey: string) {
  const cached = searchCache.get(cacheKey);
  if (!cached || cached.expiresAt <= Date.now()) {
    searchCache.delete(cacheKey);
    return null;
  }
  return cached.leads;
}

function cacheLeads(cacheKey: string, leads: FoundLead[]) {
  searchCache.set(cacheKey, { expiresAt: Date.now() + cacheTtl, leads });
  if (searchCache.size > 100) searchCache.delete(searchCache.keys().next().value!);
}

export async function searchPlaces(
  niche: string,
  location: string,
  limit: number,
  strictSPlus = false,
): Promise<FoundLead[]> {
  const cacheKey = `${normalizeText(niche.trim())}|${normalizeText(location.trim())}|${limit}|${strictSPlus}`;
  const cached = getCachedLeads(cacheKey);
  if (cached) return cached;

  let photonResponse: Response;
  try {
    const url = new URL(photonUrl);
    url.searchParams.set("q", location);
    url.searchParams.set("limit", "1");
    photonResponse = await fetch(url, {
      headers: { "User-Agent": userAgent, Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new PlacesError("De open locatiezoekdienst is tijdelijk niet bereikbaar. Probeer het opnieuw.", 503);
  }

  if (!photonResponse.ok) {
    throw new PlacesError(
      photonResponse.status === 429
        ? "De publieke locatiezoekdienst is druk. Wacht even en probeer opnieuw."
        : "De publieke locatiezoekdienst reageert niet goed. Probeer het later opnieuw.",
      photonResponse.status === 429 ? 429 : 503,
    );
  }

  const photonData = (await photonResponse.json()) as PhotonResponse;
  const locationFeature = photonData.features?.[0];
  if (!locationFeature) throw new PlacesError("Locatie niet gevonden. Controleer de plaatsnaam.", 404);
  const boundingBox = getBoundingBox(locationFeature);
  const city = locationFeature.properties?.city || locationFeature.properties?.name || location;

  const categoryFilters = getTagFilters(niche);
  if (strictSPlus && categoryFilters.length === 0) {
    throw new PlacesError("Strikt S+ is alleen beschikbaar voor herkende branches, zoals tandarts, kapper of accountant.", 422);
  }
  const filters = categoryFilters.map(
    ([key, value]) => `nwr["${key}"="${value}"](${boundingBox});`,
  );
  if (!strictSPlus) {
    const namePattern = escapeOverpassString(escapeRegex(niche.trim()).replace(/\s+/g, ".*"));
    filters.push(`nwr["name"~"${namePattern}",i](${boundingBox});`);
  }
  const query = `[out:json][timeout:20][maxsize:67108864];(${filters.join("")});out center;`;

  let overpassResponse: Response;
  try {
    overpassResponse = await fetch(overpassUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
        "User-Agent": userAgent,
        Accept: "application/json",
      },
      body: query,
      signal: AbortSignal.timeout(25_000),
    });
  } catch {
    throw new PlacesError("De gratis OpenStreetMap-zoekdienst is tijdelijk niet bereikbaar. Probeer opnieuw.", 503);
  }

  if (!overpassResponse.ok) {
    throw new PlacesError(
      overpassResponse.status === 429 || overpassResponse.status === 504
        ? "De gratis OpenStreetMap-zoekdienst is druk. Wacht even en probeer opnieuw."
        : "De OpenStreetMap-zoekopdracht is mislukt. Probeer een kleinere plaats of andere branche.",
      overpassResponse.status === 429 ? 429 : 503,
    );
  }

  const overpassData = (await overpassResponse.json()) as OverpassResponse;
  const uniqueLeads = new Map<string, FoundLead>();
  for (const element of overpassData.elements ?? []) {
    const lead = mapElement(element, city, categoryFilters);
    if (lead && (!strictSPlus || lead.leadGrade === "S_PLUS")) uniqueLeads.set(lead.placeId, lead);
  }
  const gradeOrder: Record<LeadGrade, number> = { S_PLUS: 0, S: 1, A: 2, B: 3 };
  const leads = [...uniqueLeads.values()]
    .sort(
      (left, right) =>
        gradeOrder[left.leadGrade] - gradeOrder[right.leadGrade] ||
        Number(Boolean(right.phone)) - Number(Boolean(left.phone)) ||
        left.digitalHealthScore - right.digitalHealthScore ||
        left.businessName.localeCompare(right.businessName),
    )
    .slice(0, limit);

  cacheLeads(cacheKey, leads);
  return leads;
}
