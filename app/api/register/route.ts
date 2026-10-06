import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const registrationSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  password: z.string().min(10).max(128),
});

export async function POST(request: Request) {
  const parsed = registrationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Vul een naam, geldig e-mailadres en wachtwoord van minimaal 10 tekens in." },
      { status: 400 },
    );
  }

  try {
    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        passwordHash: await bcrypt.hash(parsed.data.password, 12),
        credits: 50,
      },
    });
    return NextResponse.json({ created: true }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "Voor dit e-mailadres bestaat al een account." }, { status: 409 });
    }
    return NextResponse.json({ error: "Account aanmaken is niet gelukt. Probeer het opnieuw." }, { status: 500 });
  }
}