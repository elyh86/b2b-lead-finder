import { calculateDigitalHealthScore } from "@/lib/lead-score";

type PlacesResponse = {
  places?: Array<{
    id?: string;
    displayName?: { text?: string };
    formattedAddress?: string;
    nationalPhoneNumber?: string;
    websiteUri?: string;
    rating?: number;
    userRatingCount?: number;
  }>;
};

export type FoundLead = {
  placeId: string;
  businessName: string;
  phone: string | null;
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

export async function searchPlaces(
  niche: string,
  location: string,
  limit: number,
): Promise<FoundLead[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new PlacesError("Google Places is nog niet geconfigureerd.", 503);

  let response: Response;
  try {
    response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": [
          "places.id",
          "places.displayName",
          "places.formattedAddress",
          "places.nationalPhoneNumber",
          "places.websiteUri",
          "places.rating",
          "places.userRatingCount",
        ].join(","),
      },
      body: JSON.stringify({
        textQuery: `${niche} in ${location}`,
        pageSize: limit,
        languageCode: "nl",
      }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new PlacesError("Google Places is niet bereikbaar. Probeer het later opnieuw.", 502);
  }

  if (!response.ok) {
    throw new PlacesError(
      response.status === 429
        ? "Google Places heeft de aanvraaglimiet bereikt. Probeer het later opnieuw."
        : "Google Places heeft de zoekopdracht geweigerd. Controleer de API-sleutel en facturatie.",
      response.status === 429 ? 429 : 502,
    );
  }

  const data = (await response.json()) as PlacesResponse;
  return (data.places ?? [])
    .filter((place): place is typeof place & { id: string } => Boolean(place.id))
    .map((place) => {
      const signals = {
        website: place.websiteUri ?? null,
        rating: place.rating ?? null,
        reviewCount: place.userRatingCount ?? 0,
        phone: place.nationalPhoneNumber ?? null,
      };
      return {
        placeId: place.id,
        businessName: place.displayName?.text?.trim() || "Onbekend bedrijf",
        phone: signals.phone,
        address: place.formattedAddress ?? "Adres niet beschikbaar",
        website: signals.website,
        rating: signals.rating,
        reviewCount: signals.reviewCount,
        digitalHealthScore: calculateDigitalHealthScore(signals),
      };
    });
}