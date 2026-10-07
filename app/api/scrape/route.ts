import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PlacesError, searchPlaces } from "@/lib/places";
import { selectScanResults } from "@/lib/scan-results";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const searchSchema = z.object({
  niche: z.string().trim().min(2).max(100),
  location: z.string().trim().min(2).max(100),
  limit: z.number().int().min(1).max(20).default(20),
  strictSPlus: z.boolean().default(false),
});

class InsufficientCreditsError extends Error {}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Log in om leads te zoeken." }, { status: 401 });
  }

  const parsed = searchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Vul een niche en locatie in." }, { status: 400 });
  }

  const account = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { credits: true, unlimitedCredits: true },
  });
  if (!account) return NextResponse.json({ error: "Account niet gevonden." }, { status: 404 });
  if (!account.unlimitedCredits && account.credits < 1) {
    return NextResponse.json(
      { error: "Je beta-credits zijn op. De gratis beta biedt 50 zoekcredits per account." },
      { status: 402 },
    );
  }

  try {
    const foundLeads = await searchPlaces(parsed.data.niche, parsed.data.location, parsed.data.limit, parsed.data.strictSPlus);
    const result = await prisma.$transaction(async (transaction) => {
      const latestAccount = await transaction.user.findUnique({
        where: { id: session.user.id },
        select: { credits: true, unlimitedCredits: true },
      });
      if (!latestAccount) throw new Error("Account niet gevonden.");

      const existingLeads = await transaction.lead.findMany({
        where: { userId: session.user.id, placeId: { in: foundLeads.map((lead) => lead.placeId) } },
        select: { placeId: true },
      });
      const knownPlaceIds = new Set(existingLeads.map((lead) => lead.placeId));
      const { leads, billableLeads } = selectScanResults(
        foundLeads,
        knownPlaceIds,
        latestAccount.credits,
        latestAccount.unlimitedCredits,
      );

      if (
        !latestAccount.unlimitedCredits &&
        latestAccount.credits < 1 &&
        foundLeads.some((lead) => !knownPlaceIds.has(lead.placeId))
      ) {
        throw new InsufficientCreditsError();
      }

      if (!latestAccount.unlimitedCredits && billableLeads.length > 0) {
        const charged = await transaction.user.updateMany({
          where: { id: session.user.id, credits: { gte: billableLeads.length } },
          data: { credits: { decrement: billableLeads.length } },
        });
        if (charged.count !== 1) throw new InsufficientCreditsError();
      }

      const scan = await transaction.scan.create({
        data: {
          niche: parsed.data.niche,
          location: parsed.data.location,
          resultCount: leads.length,
          creditsUsed: latestAccount.unlimitedCredits ? 0 : billableLeads.length,
          userId: session.user.id,
        },
      });
      if (billableLeads.length > 0) {
        await transaction.lead.createMany({
          data: billableLeads.map((lead) => ({ ...lead, userId: session.user.id, scanId: scan.id })),
        });
      }
      if (parsed.data.strictSPlus && leads.length > 0) {
        await transaction.lead.updateMany({
          where: { userId: session.user.id, placeId: { in: leads.map((lead) => lead.placeId) } },
          data: { leadGrade: "S_PLUS" },
        });
      }
      const savedLeads = await transaction.lead.findMany({
        where: { userId: session.user.id, placeId: { in: leads.map((lead) => lead.placeId) } },
        select: {
          id: true,
          placeId: true,
          businessName: true,
          phone: true,
          email: true,
          address: true,
          website: true,
          rating: true,
          reviewCount: true,
          digitalHealthScore: true,
          leadGrade: true,
          status: true,
          notes: true,
          nextFollowUpAt: true,
        },
      });
      const savedLeadsByPlaceId = new Map(savedLeads.map((lead) => [lead.placeId, lead]));
      return {
        leads: leads.flatMap((lead) => {
          const savedLead = savedLeadsByPlaceId.get(lead.placeId);
          return savedLead ? [savedLead] : [];
        }),
        credits: latestAccount.unlimitedCredits
          ? latestAccount.credits
          : latestAccount.credits - billableLeads.length,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof InsufficientCreditsError) {
      return NextResponse.json(
        { error: "Je beta-credits zijn op. Elk account krijgt 50 zoekcredits tijdens de gratis beta." },
        { status: 402 },
      );
    }
    if (error instanceof PlacesError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Zoeken is niet gelukt. Probeer het opnieuw." }, { status: 500 });
  }
}