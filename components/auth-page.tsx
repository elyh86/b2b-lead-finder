import { auth } from "@/auth";
import { AuthForm } from "@/components/auth-form";
import { Search } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

function safeNextPath(value: string | undefined) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

export async function AuthPage({ mode, next }: { mode: "login" | "register"; next?: string }) {
  if (await auth()) redirect(safeNextPath(next));
  const destination = safeNextPath(next);
  return (
    <main className="auth-page">
      <aside className="auth-aside">
        <Link aria-label="B2B Lead Finder home" className="brand" href="/"><span className="brand-mark"><Search aria-hidden="true" size={16} /></span><span>B2B Lead Finder</span></Link>
        <div className="auth-aside-copy"><span className="eyebrow">B2B prospecting, met richting</span><h1 className="display">Een betere lijst verandert het gesprek.</h1><p>Vind bedrijven met digitale kansen en begin met een relevante reden om contact op te nemen.</p></div>
        <span className="auth-quote">01 / Ontdek. Prioriteer. Benader.</span>
      </aside>
      <section className="auth-main"><AuthForm mode={mode} nextPath={destination} /></section>
    </main>
  );
}
