import { afterEach, describe, expect, it, vi } from "vitest";
import { searchPlaces } from "./places";

const photonLocation = {
  features: [
    {
      geometry: { coordinates: [5.13, 52.09] },
      properties: {
        name: "Utrecht",
        city: "Utrecht",
        extent: [4.970096, 52.1420506, 5.195155, 52.026282],
      },
    },
  ],
};

function jsonResponse(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => vi.unstubAllGlobals());

describe("searchPlaces", () => {
  it("uses Photon and bounded Overpass results without an API key", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    fetchMock
      .mockResolvedValueOnce(jsonResponse(photonLocation))
      .mockResolvedValueOnce(jsonResponse({
        elements: [
          {
            type: "node",
            id: 100,
            tags: {
              name: "Tandarts De Brug",
              amenity: "dentist",
              phone: "+31301234567",
              "addr:street": "Voorbeeldstraat",
              "addr:housenumber": "12",
              "addr:postcode": "3511 AA",
              "addr:city": "Utrecht",
            },
          },
          {
            type: "node",
            id: 101,
            tags: {
              name: "Tandartspraktijk Website",
              amenity: "dentist",
              phone: "+31307654321",
              website: "praktijk.example",
              "contact:email": "info@praktijk.example",
            },
          },
          {
            type: "node",
            id: 102,
            tags: { name: "Tandarts zonder telefoon", amenity: "dentist" },
          },
        ],
      }));
    vi.stubGlobal("fetch", fetchMock);

    const leads = await searchPlaces("tandarts", "Utrecht, Nederland", 20);
    const request = fetchMock.mock.calls[1][1];
    const query = String(request?.body);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0][0])).toContain("photon.komoot.io");
    expect(query).toContain('nwr["amenity"="dentist"]');
    expect(query).toContain("(52.026282,4.970096,52.1420506,5.195155)");
    expect(leads).toHaveLength(3);
    const phoneLead = leads.find((lead) => lead.businessName === "Tandarts De Brug");
    const completeLead = leads.find((lead) => lead.businessName === "Tandartspraktijk Website");
    expect(phoneLead).toMatchObject({
      placeId: "osm:node:100",
      businessName: "Tandarts De Brug",
      phone: "+31301234567",
      address: "Voorbeeldstraat 12, 3511 AA, Utrecht",
      leadGrade: "S",
      rating: null,
      reviewCount: 0,
      digitalHealthScore: 60,
    });
    expect(completeLead?.website).toBe("https://praktijk.example/");
    expect(completeLead?.email).toBe("info@praktijk.example");
    expect(completeLead?.leadGrade).toBe("A");
    expect(leads.map((lead) => Boolean(lead.phone))).toEqual([true, true, false]);
  });

  it("strict mode queries exact OSM categories and returns only S+ contact records", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    fetchMock
      .mockResolvedValueOnce(jsonResponse(photonLocation))
      .mockResolvedValueOnce(jsonResponse({
        elements: [
          { type: "node", id: 200, tags: { name: "Complete Dentist", amenity: "dentist", phone: "+31111", email: "hello@example.nl" } },
          { type: "node", id: 203, tags: { name: "Complete Dentist With Website", amenity: "dentist", phone: "+31112", email: "website@example.nl", website: "https://example.nl" } },
          { type: "node", id: 201, tags: { name: "Phone Only Dentist", amenity: "dentist", phone: "+31222" } },
          { type: "node", id: 202, tags: { name: "Name Only Dentist", phone: "+31333", email: "name@example.nl" } },
        ],
      }));
    vi.stubGlobal("fetch", fetchMock);

    const leads = await searchPlaces("tandarts", "Utrecht strict test", 20, true);
    const query = String(fetchMock.mock.calls[1][1]?.body);

    expect(query).toContain('nwr["amenity"="dentist"]');
    expect(query).not.toContain('["name"~');
    expect(leads).toHaveLength(1);
    expect(leads[0]).toMatchObject({ businessName: "Complete Dentist", leadGrade: "S_PLUS" });
  });

  it("does not broaden strict search for an unsupported niche", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(jsonResponse(photonLocation));
    vi.stubGlobal("fetch", fetchMock);

    await expect(searchPlaces("rocket engineers", "Utrecht strict unsupported", 20, true)).rejects.toMatchObject({
      status: 422,
      message: expect.stringContaining("Strikt S+"),
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reuses a short-lived cached result for the same search", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    fetchMock
      .mockResolvedValueOnce(jsonResponse(photonLocation))
      .mockResolvedValueOnce(jsonResponse({ elements: [] }));
    vi.stubGlobal("fetch", fetchMock);

    const firstResult = await searchPlaces("cacheprobe", "Utrecht cache test", 5);
    const secondResult = await searchPlaces("cacheprobe", "Utrecht cache test", 5);

    expect(firstResult).toEqual([]);
    expect(secondResult).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("reports a clear error when Photon cannot resolve the location", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(jsonResponse({ features: [] }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(searchPlaces("tandarts", "Unfindable Place", 20)).rejects.toMatchObject({
      status: 404,
      message: "Locatie niet gevonden. Controleer de plaatsnaam.",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});