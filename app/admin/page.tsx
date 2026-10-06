import { auth } from "@/auth";
import { SignOutButton } from "@/components/sign-out-button";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Search, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=%2Fadmin");

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, name: true, email: true },
  });
  if (currentUser?.role !== "ADMIN") notFound();

  const [userCount, leadCount, scanCount, users] = await Promise.all([
    prisma.user.count(),
    prisma.lead.count(),
    prisma.scan.count(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, name: true, email: true, role: true, plan: true, credits: true, unlimitedCredits: true, createdAt: true },
    }),
  ]);

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-header-inner">
          <Link className="brand" href="/"><span className="brand-mark"><Search aria-hidden="true" size={16} /></span><span>B2B Lead Finder</span></Link>
          <div className="dashboard-user"><Link className="button button-outline button-small" href="/dashboard"><ArrowLeft aria-hidden="true" size={14} /> Finder</Link><span>{currentUser.name ?? currentUser.email}</span><SignOutButton /></div>
        </div>
      </header>
      <section className="dashboard-main">
        <div className="dashboard-title-row">
          <div><span className="eyebrow">Beheer / Overzicht</span><h1 className="display">Admin</h1><p>Account- en gebruiksoverzicht.</p></div>
          <div className="admin-role-pill"><ShieldCheck aria-hidden="true" size={15} /> Beheerdersrechten actief</div>
        </div>
        <div className="admin-metrics">
          <article className="admin-metric"><span>ACCOUNTS</span><strong>{userCount.toLocaleString("nl-NL")}</strong></article>
          <article className="admin-metric"><span>LEADS</span><strong>{leadCount.toLocaleString("nl-NL")}</strong></article>
          <article className="admin-metric"><span>SCANS</span><strong>{scanCount.toLocaleString("nl-NL")}</strong></article>
        </div>
        <div className="admin-list-heading"><h2>Recente accounts</h2><span>{users.length} getoond · maximaal 50</span></div>
        <div className="table-wrap">
          {users.length === 0 ? <div className="table-empty"><span className="table-empty-icon"><Users aria-hidden="true" size={18} /></span><h3>Nog geen accounts</h3><p>Accounts verschijnen hier nadat iemand zich heeft geregistreerd.</p></div> : (
            <table className="lead-table admin-table"><thead><tr><th>Naam</th><th>E-mailadres</th><th>Rol</th><th>Plan</th><th>Credits</th><th>Aangemaakt</th></tr></thead><tbody>
              {users.map((user) => <tr key={user.id}><td className="lead-name">{user.name ?? "—"}</td><td>{user.email}</td><td><span className={`admin-role-tag ${user.role === "ADMIN" ? "is-admin" : ""}`}>{user.role === "ADMIN" ? "Admin" : "Klant"}</span></td><td>{user.plan}</td><td>{user.unlimitedCredits ? "Onbeperkt" : user.credits.toLocaleString("nl-NL")}</td><td>{new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium" }).format(user.createdAt)}</td></tr>)}
            </tbody></table>
          )}
        </div>
      </section>
    </main>
  );
}
