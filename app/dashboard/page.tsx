import { auth } from "@/auth";
import { SignOutButton } from "@/components/sign-out-button";
import { LeadDashboard } from "@/components/lead-dashboard";
import { prisma } from "@/lib/prisma";
import { Search } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=%2Fdashboard");

  const [account, storedLeads] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { credits: true, plan: true, role: true, unlimitedCredits: true, name: true, email: true },
    }),
    prisma.lead.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        placeId: true,
        businessName: true,
        phone: true,
        address: true,
        website: true,
        rating: true,
        reviewCount: true,
        digitalHealthScore: true,
      },
    }),
  ]);

  if (!account) redirect("/login");
  const initialLeads = storedLeads.map((lead) => ({ ...lead, rating: lead.rating ?? null }));

  return (
    <main>
      <header className="dashboard-header">
        <div className="dashboard-header-inner">
          <Link aria-label="B2B Lead Finder home" className="brand" href="/"><span className="brand-mark"><Search aria-hidden="true" size={16} /></span><span>B2B Lead Finder</span></Link>
          <div className="dashboard-user"><span>{account.name ?? account.email}</span>{account.role === "ADMIN" ? <Link className="button button-outline button-small" href="/admin">Beheer</Link> : null}<SignOutButton /></div>
        </div>
      </header>
      <LeadDashboard initialLeads={initialLeads} initialCredits={account.credits} plan={account.plan} unlimited={account.unlimitedCredits} />
    </main>
  );
}
