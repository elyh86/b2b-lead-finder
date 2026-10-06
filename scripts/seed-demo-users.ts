import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

const adminEmail = "admin@b2b-lead-finder.test";
const customerEmail = "klant@b2b-lead-finder.test";

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Demoaccounts mogen niet in productie worden aangemaakt.");
  }
  if (!process.env.DATABASE_URL?.startsWith("file:")) {
    throw new Error("Demoaccounts mogen alleen op een lokale SQLite-database worden aangemaakt.");
  }

  const adminPassword = randomBytes(18).toString("base64url");
  const customerPassword = randomBytes(18).toString("base64url");
  const [adminPasswordHash, customerPasswordHash] = await Promise.all([
    bcrypt.hash(adminPassword, 12),
    bcrypt.hash(customerPassword, 12),
  ]);

  await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      name: "Demo Beheerder",
      email: adminEmail,
      passwordHash: adminPasswordHash,
      credits: 50,
      role: "ADMIN",
    },
    update: {
      passwordHash: adminPasswordHash,
      credits: 50,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: customerEmail },
    create: {
      name: "Demo Klant",
      email: customerEmail,
      passwordHash: customerPasswordHash,
      credits: 50,
      role: "CUSTOMER",
    },
    update: {
      passwordHash: customerPasswordHash,
      credits: 50,
      role: "CUSTOMER",
    },
  });

  console.log("Demoaccounts aangemaakt. Bewaar deze wachtwoorden; ze worden niet opgeslagen als platte tekst.");
  console.log(`ADMIN   ${adminEmail}   ${adminPassword}`);
  console.log(`KLANT   ${customerEmail}   ${customerPassword}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
