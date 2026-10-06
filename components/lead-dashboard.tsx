"use client";

import { ArrowDownToLine, ArrowRight, Building2, Check, LoaderCircle, MapPin, Search, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import type { LeadRecord } from "@/lib/types";
import { CheckoutButton } from "@/components/checkout-button";

const scanStages = ["Bedrijven zoeken", "Bedrijfsgegevens ophalen", "Kansen rangschikken"];
type Filter = "all" | "no-website" | "low-rating" | "few-reviews";

function csvCell(value: string | number | null) {
  let text = value === null ? "" : String(value);
  if (/^[\u0000-\u0020]*[=+@\-]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

function exportLeads(leads: LeadRecord[]) {
  const columns = ["Bedrijf", "Telefoon", "Adres", "Website", "Google-beoordeling", "Aantal reviews", "Digital Health Score"];
  const rows = leads.map((lead) => [
    lead.businessName,
    lead.phone,
    lead.address,
    lead.website,
    lead.rating,
    lead.reviewCount,
    lead.digitalHealthScore,
  ]);
  const content = [columns, ...rows].map((row) => row.map(csvCell).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\ufeff", content], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `b2b-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export function LeadDashboard({
  initialLeads,
  initialCredits,
  plan,
  unlimited,
}: {
  initialLeads: LeadRecord[];
  initialCredits: number;
  plan: string;
  unlimited: boolean;
}) {
  const [niche, setNiche] = useState("");
  const [location, setLocation] = useState("");
  const [leads, setLeads] = useState(initialLeads);
  const [credits, setCredits] = useState(initialCredits);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!loading) return;
    const timer = window.setInterval(() => setStage((current) => Math.min(current + 1, scanStages.length - 1)), 1800);
    return () => window.clearInterval(timer);
  }, [loading]);

  const filteredLeads = leads.filter((lead) => {
    if (filter === "no-website") return !lead.website;
    if (filter === "low-rating") return lead.rating !== null && lead.rating < 4;
    if (filter === "few-reviews") return lead.reviewCount < 10;
    return true;
  });

  async function scan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStage(0);
    setError("");
    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, location, limit: 20 }),
      });
      const result = (await response.json()) as { leads?: LeadRecord[]; credits?: number; error?: string };
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login?next=%2Fdashboard");
          return;
        }
        if (response.status === 402) setError(`${result.error ?? "Je credits zijn op."} Kies een abonnement om door te gaan.`);
        else setError(result.error ?? "Zoeken is niet gelukt.");
        return;
      }
      setLeads(result.leads ?? []);
      if (typeof result.credits === "number") setCredits(result.credits);
      setFilter("all");
    } catch {
      setError("De server is niet bereikbaar. Controleer je verbinding en probeer opnieuw.");
    } finally {
      setLoading(false);
    }
  }

  const hasCredits = unlimited || credits > 0;
  const filters: Array<{ id: Filter; label: string }> = [
    { id: "all", label: "Alle leads" },
    { id: "no-website", label: "Geen website" },
    { id: "low-rating", label: "Rating < 4" },
    { id: "few-reviews", label: "< 10 reviews" },
  ];

  return (
    <div className="dashboard">
      <section className="dashboard-main">
        <div className="dashboard-title-row">
          <div><span className="eyebrow">Lead finder / Werkruimte</span><h1 className="display">Jouw volgende lead.</h1><p>Vind lokale bedrijven en ontdek waar digitale kansen liggen.</p></div>
          <div aria-label={unlimited ? "Onbeperkt credits" : `${credits} credits beschikbaar`} className="credits-widget"><span className="credits-icon"><Sparkles aria-hidden="true" size={17} /></span><div><div className="credits-number">{unlimited ? "Onbeperkt" : credits.toLocaleString("nl-NL")}</div><div className="credits-caption">{plan === "FREE" ? "GRATIS CREDITS" : `${plan} · CREDITS`}</div></div></div>
        </div>

        <section aria-label="Nieuwe zoekopdracht" className="finder-panel">
          <div className="finder-heading"><Search aria-hidden="true" size={16} /> Nieuwe zoekopdracht</div>
          <form className="search-form" onSubmit={scan}>
            <div className="search-field"><label htmlFor="niche">Branche of niche</label><input autoComplete="off" id="niche" maxLength={100} minLength={2} onChange={(event) => setNiche(event.target.value)} placeholder="Bijv. tandarts, installateur" required value={niche} /></div>
            <div className="search-field"><label htmlFor="location">Locatie</label><input autoComplete="off" id="location" maxLength={100} minLength={2} onChange={(event) => setLocation(event.target.value)} placeholder="Bijv. Utrecht, Nederland" required value={location} /></div>
            <div className="search-field"><label htmlFor="limit">Max. resultaten</label><input aria-label="Maximum aantal resultaten" disabled id="limit" readOnly value="20 leads" /></div>
            <button className="button button-dark scan-button" disabled={loading || !hasCredits} type="submit">{loading ? <LoaderCircle aria-hidden="true" className="animate-spin" size={15} /> : <Search aria-hidden="true" size={15} />}{loading ? "Scannen..." : "Start scan"}</button>
          </form>
          {loading ? <div aria-live="polite"><div className="scan-steps">{scanStages.map((label, index) => <span className={`scan-step ${index === stage ? "active" : index < stage ? "done" : ""}`} key={label}>{index < stage ? <Check aria-hidden="true" size={12} /> : <span className="step-dot" />}{label}</span>)}</div><div className="progress-track"><div className="progress-indicator" /></div></div> : null}
        </section>

        {error ? <div className="auth-error dashboard-error" role="alert">{error}</div> : null}

        <div className="results-head">
          <div className="results-title"><h2>Leadresultaten</h2><span className="results-count">{filteredLeads.length} {filteredLeads.length === 1 ? "bedrijf" : "bedrijven"}</span></div>
          <div className="results-actions">
            <div aria-label="Filter leads" className="filters" role="group">{filters.map((item) => <button aria-pressed={filter === item.id} className="filter-button" key={item.id} onClick={() => setFilter(item.id)} type="button">{item.label}</button>)}</div>
            <button className="button button-outline button-small" disabled={filteredLeads.length === 0} onClick={() => exportLeads(filteredLeads)} type="button"><ArrowDownToLine aria-hidden="true" size={14} /><span>CSV</span></button>
          </div>
        </div>

        <div className="table-wrap">
          {filteredLeads.length === 0 ? <div className="table-empty"><span className="table-empty-icon"><Building2 aria-hidden="true" size={18} /></span><h3>{leads.length === 0 ? "Je lijst begint hier." : "Geen resultaten voor dit filter."}</h3><p>{leads.length === 0 ? "Zoek op een branche en locatie. We tonen bedrijven met hun contactgegevens en digitale gezondheidsscore." : "Kies een ander filter of voer een nieuwe zoekopdracht uit."}</p></div> : (
            <table className="lead-table"><thead><tr><th>Bedrijf</th><th>Telefoon</th><th>Locatie</th><th>Rating</th><th>Reviews</th><th>Website</th><th>Score</th></tr></thead><tbody>{filteredLeads.map((lead) => <tr key={lead.id ?? lead.placeId}><td className="lead-name">{lead.businessName}</td><td>{lead.phone ?? <span className="lead-muted">Niet gevonden</span>}</td><td className="lead-address">{lead.address}</td><td>{lead.rating === null ? <span className="lead-muted">—</span> : <span className="rating">★ {lead.rating.toFixed(1)}</span>}</td><td>{lead.reviewCount}</td><td>{lead.website ? <a className="text-link" href={lead.website} rel="noreferrer" target="_blank">Website <ArrowRight aria-hidden="true" size={11} /></a> : <span className="lead-muted">Ontbreekt</span>}</td><td><span className={`score lead-score ${lead.digitalHealthScore >= 60 ? "score-mid" : ""}`}>{lead.digitalHealthScore}</span></td></tr>)}</tbody></table>
          )}
        </div>

        {!hasCredits || plan === "FREE" ? <div className="upgrade-strip"><p><strong>{!hasCredits ? "Je gratis credits zijn op." : "Klaar voor meer leads?"}</strong> Starter geeft je 1.000 credits per maand; Pro laat je onbeperkt zoeken.</p><CheckoutButton label="Bekijk abonnementen" plan="STARTER" /></div> : null}
        <p className="dashboard-footer"><MapPin aria-hidden="true" size={12} /> Resultaten via Google Places · Maximaal 20 per scan · {unlimited ? "Pro, onbeperkt" : "1 credit per gevonden bedrijf"}</p>
      </section>
    </div>
  );
}
