import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { leadStatuses } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}).transform((value) => new Date(`${value}T12:00:00.000Z`));

const leadUpdateSchema = z.object({
  status: z.enum(leadStatuses).optional(),
  notes: z.string().trim().max(2_000).nullable().optional(),
  nextFollowUpAt: dateSchema.nullable().optional(),
}).strict().refine((value) => Object.values(value).some((field) => field !== undefined));

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Log in om leads bij te werken." }, { status: 401 });
  }

  const parsed = leadUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Ongeldige CRM-gegevens." }, { status: 400 });
  }

  const { id } = await context.params;
  const existingLead = await prisma.lead.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  if (!existingLead) {
    return NextResponse.json({ error: "Lead niet gevonden." }, { status: 404 });
  }

  const lead = await prisma.lead.update({
    where: { id: existingLead.id },
    data: parsed.data,
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

  return NextResponse.json({ lead });
}