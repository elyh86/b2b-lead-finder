import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PlacesError, searchPlaces } from "@/lib/places";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const searchSchema = z.object({
  niche: z.string().trim().min(2).max(100),
  location: z.string().trim().min(2).max(100),
  limit: z.number().int().min(1).max(20).default(20),
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
      { error: "Je credits zijn op. Upgrade je abonnement om verder te zoeken." },
      { status: 402 },
    );
  }

  try {
    const leads = await searchPlaces(parsed.data.niche, parsed.data.location, parsed.data.limit);
    const balance = await prisma.$transaction(async (transaction) => {
      const latestAccount = await transaction.user.findUnique({
        where: { id: session.user.id },
        select: { credits: true, unlimitedCredits: true },
      });
      if (!latestAccount) throw new Error("Account niet gevonden.");
      if (!latestAccount.unlimitedCredits && latestAccount.credits < leads.length) {
        throw new InsufficientCreditsError();
      }

      if (!latestAccount.unlimitedCredits && leads.length > 0) {
        const charged = await transaction.user.updateMany({
          where: { id: session.user.id, credits: { gte: leads.length } },
          data: { credits: { decrement: leads.length } },
        });
        if (charged.count !== 1) throw new InsufficientCreditsError();
      }

      const scan = await transaction.scan.create({
        data: {
          niche: parsed.data.niche,
          location: parsed.data.location,
          resultCount: leads.length,
          creditsUsed: latestAccount.unlimitedCredits ? 0 : leads.length,
          userId: session.user.id,
        },
      });
      if (leads.length > 0) {
        await transaction.lead.createMany({
          data: leads.map((lead) => ({ ...lead, userId: session.user.id, scanId: scan.id })),
        });
      }
      return latestAccount.unlimitedCredits
        ? latestAccount.credits
        : latestAccount.credits - leads.length;
    });

    return NextResponse.json({ leads, credits: balance });
  } catch (error) {
    if (error instanceof InsufficientCreditsError) {
      return NextResponse.json(
        { error: "Onvoldoende credits voor deze scan. Upgrade je abonnement om verder te zoeken." },
        { status: 402 },
      );
    }
    if (error instanceof PlacesError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Zoeken is niet gelukt. Probeer het opnieuw." }, { status: 500 });
  }
}