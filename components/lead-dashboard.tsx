"use client";

import { ArrowDownToLine, ArrowRight, Building2, Check, LoaderCircle, MapPin, Pencil, Save, Search, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { leadGradeLabels, leadStatuses, leadStatusLabels, type LeadRecord, type LeadStatus } from "@/lib/types";

const scanStages = ["Bedrijven zoeken", "Bedrijfsgegevens ophalen", "Kansen rangschikken"];
type Filter = "all" | "no-website" | "no-phone" | "low-score";
type FollowUpFilter = "all" | "due" | "scheduled";
type LeadDraft = { status: LeadStatus; notes: string; nextFollowUpAt: string };

function csvCell(value: string | number | null) {
  let text = value === null ? "" : String(value);
  if (/^[\u0000-\u0020]*[=+@\-]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

function exportLeads(leads: LeadRecord[]) {
  const columns = ["Bedrijf", "Telefoon", "E-mail", "Adres", "Website", "Kwaliteit", "Status", "Opvolgdatum", "Notities", "Digitale gezondheidsscore"];
  const rows = leads.map((lead) => [
    lead.businessName,
    lead.phone,
    lead.email,
    lead.address,
    lead.website,
    leadGradeLabels[lead.leadGrade],
    leadStatusLabels[lead.status],
    lead.nextFollowUpAt,
    lead.notes,
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

function formatFollowUpDate(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", year: "numeric" })
    .format(new Date(`${value.slice(0, 10)}T12:00:00`));
}

function localDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeSearch(value: string) {
  return value.trim().toLocaleLowerCase("nl");
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
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "ALL">("ALL");
  const [followUpFilter, setFollowUpFilter] = useState<FollowUpFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [strictSPlus, setStrictSPlus] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState("");
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [leadDraft, setLeadDraft] = useState<LeadDraft | null>(null);
  const [savingCrm, setSavingCrm] = useState(false);
  const [crmError, setCrmError] = useState("");
  const router = useRouter();
  const editingLead = leads.find((lead) => lead.id === editingLeadId) ?? null;

  useEffect(() => {
    if (!loading) return;
    const timer = window.setInterval(() => setStage((current) => Math.min(current + 1, scanStages.length - 1)), 1800);
    return () => window.clearInterval(timer);
  }, [loading]);

  useEffect(() => {
    if (!editingLeadId) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !savingCrm) {
        setEditingLeadId(null);
        setLeadDraft(null);
        setCrmError("");
      }
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [editingLeadId, savingCrm]);

  const today = localDateValue();
  const activeLeads = leads.filter((lead) => lead.status !== "WON" && lead.status !== "LOST");
  const dueFollowUps = activeLeads.filter((lead) => lead.nextFollowUpAt && lead.nextFollowUpAt.slice(0, 10) <= today);
  const newLeads = leads.filter((lead) => lead.status === "NEW");
  const wonLeads = leads.filter((lead) => lead.status === "WON");
  const normalizedSearch = normalizeSearch(searchQuery);
  const filteredLeads = leads.filter((lead) => {
    if (normalizedSearch && ![
      lead.businessName,
      lead.phone ?? "",
      lead.email ?? "",
      lead.address,
      lead.notes ?? "",
    ].some((value) => normalizeSearch(value).includes(normalizedSearch))) return false;
    if (statusFilter !== "ALL" && lead.status !== statusFilter) return false;
    const followUpDate = lead.nextFollowUpAt?.slice(0, 10);
    if (followUpFilter === "due" && (!followUpDate || followUpDate > today || lead.status === "WON" || lead.status === "LOST")) return false;
    if (followUpFilter === "scheduled" && (!followUpDate || followUpDate <= today)) return false;
    if (filter === "no-website") return !lead.website;
    if (filter === "no-phone") return !lead.phone;
    if (filter === "low-score") return lead.digitalHealthScore < 60;
    return true;
  });

  function editLead(lead: LeadRecord) {
    if (!lead.id) return;
    setEditingLeadId(lead.id);
    setLeadDraft({
      status: lead.status,
      notes: lead.notes ?? "",
      nextFollowUpAt: lead.nextFollowUpAt?.slice(0, 10) ?? "",
    });
    setCrmError("");
  }

  function closeLeadEditor() {
    if (savingCrm) return;
    setEditingLeadId(null);
    setLeadDraft(null);
    setCrmError("");
  }

  async function saveLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingLeadId || !leadDraft) return;
    setSavingCrm(true);
    setCrmError("");
    try {
      const response = await fetch(`/api/leads/${encodeURIComponent(editingLeadId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: leadDraft.status,
          notes: leadDraft.notes.trim() || null,
          nextFollowUpAt: leadDraft.nextFollowUpAt || null,
        }),
      });
      const result = (await response.json()) as { lead?: LeadRecord; error?: string };
      if (!response.ok || !result.lead) {
        setCrmError(result.error ?? "Opslaan is niet gelukt.");
        return;
      }
      const savedLead = result.lead;
      setLeads((current) => current.map((lead) => lead.id === editingLeadId ? savedLead : lead));
      closeLeadEditor();
    } catch {
      setCrmError("De server is niet bereikbaar. Probeer opnieuw.");
    } finally {
      setSavingCrm(false);
    }
  }

  async function scan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStage(0);
    setError("");
    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, location, limit: 20, strictSPlus }),
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
      setStatusFilter("ALL");
      setFollowUpFilter("all");
      setSearchQuery("");
      setEditingLeadId(null);
      setLeadDraft(null);
    } catch {
      setError("De server is niet bereikbaar. Controleer je verbinding en probeer opnieuw.");
    } finally {
      setLoading(false);
    }
  }

  const hasCredits = unlimited || credits > 0;
  return (
    <div className="dashboard">
      <section className="dashboard-main">
        <div className="dashboard-title-row">
          <div><span className="eyebrow">Lead finder / Werkruimte</span><h1 className="display">Jouw volgende lead.</h1><p>Vind lokale bedrijven en ontdek waar digitale kansen liggen.</p></div>
          <div aria-label={unlimited ? "Onbeperkt credits" : `${credits} credits beschikbaar`} className="credits-widget"><span className="credits-icon"><Sparkles aria-hidden="true" size={17} /></span><div><div className="credits-number">{unlimited ? "Onbeperkt" : credits.toLocaleString("nl-NL")}</div><div className="credits-caption">{unlimited ? "ONBEPERKT" : plan === "FREE" ? "GRATIS CREDITS" : `${plan} · CREDITS`}</div></div></div>
        </div>

        <section aria-label="Nieuwe zoekopdracht" className="finder-panel">
          <div className="finder-heading"><Search aria-hidden="true" size={16} /> Nieuwe zoekopdracht</div>
          <form className="search-form" onSubmit={scan}>
            <div className="search-field"><label htmlFor="niche">Branche of niche</label><input autoComplete="off" id="niche" maxLength={100} minLength={2} onChange={(event) => setNiche(event.target.value)} placeholder="Bijv. tandarts, installateur" required value={niche} /></div>
            <div className="search-field"><label htmlFor="location">Locatie</label><input autoComplete="off" id="location" maxLength={100} minLength={2} onChange={(event) => setLocation(event.target.value)} placeholder="Bijv. Utrecht, Nederland" required value={location} /></div>
            <div className="search-field"><label htmlFor="limit">Max. resultaten</label><input aria-label="Maximum aantal resultaten" disabled id="limit" readOnly value="20 leads" /></div>
            <button className="button button-dark scan-button" disabled={loading || !hasCredits} type="submit">{loading ? <LoaderCircle aria-hidden="true" className="animate-spin" size={15} /> : <Search aria-hidden="true" size={15} />}{loading ? "Scannen..." : "Start scan"}</button>
          </form>
          <div className="quality-mode">
            <div className="quality-mode-copy"><span className="eyebrow">Leadkwaliteit</span><strong>{strictSPlus ? "Alleen S+ resultaten" : "Breed zoeken"}</strong></div>
            <div aria-label="Zoekkwaliteit voor volgende scan" className="quality-segment" role="group">
              <button aria-pressed={!strictSPlus} className="quality-segment-button" onClick={() => setStrictSPlus(false)} type="button">Breed</button>
              <button aria-pressed={strictSPlus} className="quality-segment-button" onClick={() => setStrictSPlus(true)} type="button">Strikt S+</button>
            </div>
            <p>{strictSPlus ? "S+ vereist een exacte branchetag, openbare telefoon en e-mail, en geen websitevermelding in OSM. Een site buiten OSM kan alsnog bestaan." : "S+ zoekt exacte branchetags met telefoon en e-mail, zonder websitevermelding in OSM. Kies Strikt S+ om alleen die prospects te zien."}</p>
          </div>
          {loading ? <div aria-live="polite"><div className="scan-steps">{scanStages.map((label, index) => <span className={`scan-step ${index === stage ? "active" : index < stage ? "done" : ""}`} key={label}>{index < stage ? <Check aria-hidden="true" size={12} /> : <span className="step-dot" />}{label}</span>)}</div><div className="progress-track"><div className="progress-indicator" /></div></div> : null}
        </section>

        {error ? <div className="auth-error dashboard-error" role="alert">{error}</div> : null}

        <section aria-label="CRM-overzicht" className="crm-overview">
          <div className="crm-overview-item"><span>OPEN PIPELINE</span><strong>{activeLeads.length}</strong><small>actieve leads</small></div>
          <div className="crm-overview-item crm-overview-due"><span>OPVOLGEN</span><strong>{dueFollowUps.length}</strong><small>vandaag of verlopen</small></div>
          <div className="crm-overview-item"><span>NIEUW</span><strong>{newLeads.length}</strong><small>nog niet benaderd</small></div>
          <div className="crm-overview-item crm-overview-won"><span>GEWONNEN</span><strong>{wonLeads.length}</strong><small>afgeronde deals</small></div>
        </section>

        <div className="results-head">
          <div className="results-title"><h2>Leadresultaten</h2><span className="results-count">{filteredLeads.length} {filteredLeads.length === 1 ? "bedrijf" : "bedrijven"}</span></div>
          <div className="results-actions">
            <label className="crm-search"><Search aria-hidden="true" size={14} /><input aria-label="Zoek in leads" onChange={(event) => setSearchQuery(event.target.value)} placeholder="Zoek bedrijf of contact" type="search" value={searchQuery} /></label>
            <select aria-label="Filter op CRM-status" className="crm-filter" onChange={(event) => setStatusFilter(event.target.value as LeadStatus | "ALL")} value={statusFilter}>
              <option value="ALL">Alle statussen</option>
              {leadStatuses.map((status) => <option key={status} value={status}>{leadStatusLabels[status]}</option>)}
            </select>
            <select aria-label="Filter op opvolging" className="crm-filter crm-follow-up-filter" onChange={(event) => setFollowUpFilter(event.target.value as FollowUpFilter)} value={followUpFilter}>
              <option value="all">Alle opvolging</option>
              <option value="due">Vandaag / verlopen ({dueFollowUps.length})</option>
              <option value="scheduled">Later ingepland</option>
            </select>
            <select aria-label="Filter op leadkans" className="crm-filter" onChange={(event) => setFilter(event.target.value as Filter)} value={filter}>
              <option value="all">Alle leadkansen</option>
              <option value="no-website">Geen website</option>
              <option value="no-phone">Geen telefoon</option>
              <option value="low-score">Score lager dan 60</option>
            </select>
            <button className="button button-outline button-small" disabled={filteredLeads.length === 0} onClick={() => exportLeads(filteredLeads)} type="button"><ArrowDownToLine aria-hidden="true" size={14} /><span>CSV</span></button>
          </div>
        </div>

        <div className="table-wrap">
          {filteredLeads.length === 0 ? <div className="table-empty"><span className="table-empty-icon"><Building2 aria-hidden="true" size={18} /></span><h3>{leads.length === 0 ? strictSPlus ? "Geen S+-leads gevonden." : "Je lijst begint hier." : "Geen resultaten voor dit filter."}</h3><p>{leads.length === 0 ? strictSPlus ? "S+ vereist een exacte OSM-branchetag, telefoon, e-mail en geen websitevermelding. Niet vermeld betekent niet zeker afwezig; probeer een andere plaats of branche." : "Zoek op een branche en locatie. We tonen openbare bedrijfsgegevens en herkenbare digitale hiaten." : "Pas je zoekopdracht of filters aan."}</p></div> : (
            <table className="lead-table crm-table"><thead><tr><th>Bedrijf</th><th>Contact</th><th>Leadkans</th><th>Pipeline</th><th>Volgende actie</th><th></th></tr></thead><tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.id ?? lead.placeId}>
                  <td className="crm-company-cell"><strong className="lead-name">{lead.businessName}</strong><span className="crm-company-address">{lead.address}</span></td>
                  <td className="crm-contact-cell">
                    {lead.phone ? <a className="text-link" href={`tel:${lead.phone.replace(/[^\d+]/g, "")}`}>{lead.phone}</a> : null}
                    {lead.email ? <a className="text-link" href={`mailto:${lead.email}`}>{lead.email}</a> : null}
                    {!lead.phone && !lead.email ? <span className="lead-muted">Geen contactgegevens</span> : null}
                  </td>
                  <td><div className="crm-opportunity"><span className={`lead-grade lead-grade-${lead.leadGrade.toLowerCase().replace("_", "-")}`}>{leadGradeLabels[lead.leadGrade]}</span><span className={`score lead-score ${lead.digitalHealthScore >= 60 ? "score-mid" : ""}`}>{lead.digitalHealthScore}</span><span>{!lead.website ? "Geen site vermeld" : !lead.phone ? "Geen telefoon" : "Site vermeld"}</span>{lead.website ? <a className="text-link" href={lead.website} rel="noreferrer" target="_blank">Website <ArrowRight aria-hidden="true" size={11} /></a> : null}</div></td>
                  <td><span className={`crm-status crm-status-${lead.status.toLowerCase()}`}>{leadStatusLabels[lead.status]}</span></td>
                  <td>{lead.nextFollowUpAt ? <span className={`crm-follow-up ${lead.nextFollowUpAt.slice(0, 10) <= today && lead.status !== "WON" && lead.status !== "LOST" ? "is-due" : ""}`}>{formatFollowUpDate(lead.nextFollowUpAt)}</span> : <span className="lead-muted">Geen taak gepland</span>}</td>
                  <td><button aria-label={`Lead openen: ${lead.businessName}`} className="button button-outline button-small crm-edit-button" disabled={!lead.id || savingCrm} onClick={() => editLead(lead)} type="button"><Pencil aria-hidden="true" size={14} /><span>Open lead</span></button></td>
                </tr>
              ))}
            </tbody></table>
          )}
        </div>

        {editingLead && leadDraft ? (
          <div className="crm-dialog-backdrop" onClick={(event) => { if (event.target === event.currentTarget) closeLeadEditor(); }}>
            <section aria-labelledby="crm-dialog-title" aria-modal="true" className="crm-dialog" role="dialog">
              <header className="crm-dialog-header">
                <div><span className="eyebrow">Leadbeheer</span><h2 className="display" id="crm-dialog-title">{editingLead.businessName}</h2><p>{editingLead.address}</p></div>
                <button aria-label="Leadvenster sluiten" className="button button-outline button-small crm-dialog-close" disabled={savingCrm} onClick={closeLeadEditor} type="button"><X aria-hidden="true" size={16} /></button>
              </header>
              <div className="crm-dialog-contact">
                {editingLead.phone ? <a className="text-link" href={`tel:${editingLead.phone.replace(/[^\d+]/g, "")}`}>{editingLead.phone}</a> : <span className="lead-muted">Geen telefoon</span>}
                {editingLead.email ? <a className="text-link" href={`mailto:${editingLead.email}`}>{editingLead.email}</a> : <span className="lead-muted">Geen e-mail</span>}
                {editingLead.website ? <a className="text-link" href={editingLead.website} rel="noreferrer" target="_blank">Website <ArrowRight aria-hidden="true" size={12} /></a> : <span className="lead-muted">Geen website vermeld in OSM</span>}
              </div>
              <form className="crm-dialog-form" onSubmit={saveLead}>
                <div className="search-field"><label htmlFor="crm-status">Pipeline-status</label><select id="crm-status" onChange={(event) => setLeadDraft({ ...leadDraft, status: event.target.value as LeadStatus })} value={leadDraft.status}>{leadStatuses.map((status) => <option key={status} value={status}>{leadStatusLabels[status]}</option>)}</select></div>
                <div className="search-field"><label htmlFor="crm-follow-up">Volgende opvolging</label><input id="crm-follow-up" onChange={(event) => setLeadDraft({ ...leadDraft, nextFollowUpAt: event.target.value })} type="date" value={leadDraft.nextFollowUpAt} /></div>
                <div className="search-field"><label htmlFor="crm-notes">Notities</label><textarea autoFocus id="crm-notes" maxLength={2000} onChange={(event) => setLeadDraft({ ...leadDraft, notes: event.target.value })} placeholder="Contactpersoon, behoefte, volgende stap..." rows={5} value={leadDraft.notes} /></div>
                {crmError ? <div className="inline-error" role="alert">{crmError}</div> : null}
                <footer className="crm-dialog-actions">
                  <button className="button button-outline" disabled={savingCrm} onClick={closeLeadEditor} type="button">Annuleren</button>
                  <button className="button button-dark" disabled={savingCrm} type="submit">{savingCrm ? <LoaderCircle aria-hidden="true" className="animate-spin" size={15} /> : <Save aria-hidden="true" size={15} />} Opslaan</button>
                </footer>
              </form>
            </section>
          </div>
        ) : null}

        {!unlimited && !hasCredits ? <div className="upgrade-strip"><p><strong>Je beta-credits zijn op.</strong> Bedankt voor het testen. De gratis beta gebruikt gedeelde OpenStreetMap-diensten met fair-use-limieten.</p></div> : null}
        <p className="dashboard-footer"><MapPin aria-hidden="true" size={12} /> Data: <a href="https://www.openstreetmap.org/copyright" rel="noreferrer" target="_blank">© OpenStreetMap-bijdragers</a> · Maximaal 20 per scan · {unlimited ? "Onbeperkt zoeken" : "1 credit per nieuwe lead"}</p>
      </section>
    </div>
  );
}
