import { ArrowDown, ArrowRight, ArrowUpRight, Check, MapPin, Search, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main>
      <header className="topbar">
        <div className="topbar-inner">
          <Link aria-label="B2B Lead Finder home" className="brand" href="/"><span className="brand-mark"><Search aria-hidden="true" size={16} /></span><span>B2B Lead Finder</span></Link>
          <nav aria-label="Hoofdnavigatie" className="nav-links"><a className="nav-pricing" href="#how-it-works">Zo werkt het</a><a className="nav-pricing" href="#pricing">Gratis beta</a><Link href="/login">Inloggen</Link><Link className="button button-dark button-small" href="/register">Start gratis <ArrowUpRight aria-hidden="true" size={14} /></Link></nav>
        </div>
      </header>
      <section className="hero">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <span className="eyebrow hero-kicker">Voor lokale agencies en dienstverleners</span>
            <h1 className="display">Vind lokale bedrijven met een <em>concrete kans.</em></h1>
            <p>Zoek per branche en plaats, herken digitale hiaten en volg leads op in één lichte CRM-werkruimte. Gratis beta, zonder API-sleutel.</p>
            <div className="hero-actions"><Link className="button button-dark" href="/register">Vind je eerste leads <ArrowRight aria-hidden="true" size={16} /></Link><a className="button button-outline" href="#how-it-works">Ontdek de aanpak <ArrowDown aria-hidden="true" size={14} /></a></div>
            <div className="hero-note"><ShieldCheck aria-hidden="true" size={14} /> 50 gratis credits · Geen betaalkaart of Places-sleutel nodig</div>
          </div>
          <div aria-label="Schematische voorbeeldweergave van S+ leadkwaliteit" className="preview">
            <div className="preview-top"><span className="preview-title">Voorbeeldweergave · Utrecht</span><span className="live-pill"><span className="live-dot" /> S+ selectie</span></div>
            <div className="preview-query"><Search aria-hidden="true" size={13} /> <strong>Tandarts</strong><span>·</span><MapPin aria-hidden="true" size={12} /> Utrecht</div>
            <table className="preview-table"><thead><tr><th>Bedrijf</th><th>Openbaar contact</th><th>Kwaliteit</th></tr></thead><tbody>
              <tr><td>Praktijk A</td><td>Telefoon + e-mail · geen site vermeld</td><td><span className="score score-s-plus">S+</span></td></tr>
              <tr><td>Praktijk B</td><td>Telefoon · site vermeld</td><td><span className="score">A</span></td></tr>
              <tr><td>Praktijk C</td><td className="dim">Geen direct contact</td><td><span className="score score-mid">B</span></td></tr>
            </tbody></table>
            <div className="preview-bottom"><span>S+ = branche + telefoon + e-mail + geen site in OSM</span><strong>Niet geverifieerd</strong></div>
          </div>
        </div>
      </section>
      <section aria-label="Voordelen" className="stats-band"><div className="shell stats-row">
        <div className="stat-item"><span className="stat-number">01</span><span className="stat-caption">Zoek op niche<br />en regio</span></div><div className="stat-item"><span className="stat-number">02</span><span className="stat-caption">Prioriteer met<br />digitale signalen</span></div><div className="stat-item"><span className="stat-number">03</span><span className="stat-caption">Exporteer je lijst<br />en start gesprekken</span></div>
      </div></section>
      <section className="section" id="how-it-works"><div className="shell">
        <div className="section-heading"><div><span className="eyebrow">Van zoekopdracht naar kans</span><h2 className="display">Minder zoeken.<br />Meer raak schieten.</h2></div><p>Een bruikbare lijst begint niet bij duizenden namen. Begin met bedrijven waar je aanbod echt verschil maakt.</p></div>
        <div className="workflow"><article className="workflow-item"><span className="workflow-number">01</span><h3>Kies je speelveld</h3><p>Combineer een branche met een stad, regio of postcode om lokale bedrijven te vinden.</p></article><article className="workflow-item"><span className="workflow-number">02</span><h3>Zie wat ontbreekt</h3><p>Bekijk website, telefoon en adres. De gezondheidsscore helpt digitale kansen rangschikken.</p></article><article className="workflow-item"><span className="workflow-number">03</span><h3>Neem de lijst mee</h3><p>Filter op bedrijven zonder website of telefoon en download de resultaten als CSV.</p></article></div>
      </div></section>
      <section className="pricing-section" id="pricing"><div className="shell">
        <div className="section-heading"><div><span className="eyebrow">Gratis beta · geen betaalkaart</span><h2 className="display">Eerst kansen vinden.<br />Dan pas opschalen.</h2></div><p>Deze beta helpt je lokale bedrijven met digitale kansen vinden en opvolgen. Daarom is de toegang nu gratis.</p></div>
        <div className="pricing-grid">
          <article className="price-plan featured"><span className="plan-flag">Nu beschikbaar</span><span className="plan-name">Lokale prospectie</span><div className="plan-price">€0 <small>/ gratis beta</small></div><div className="plan-credits">50 zoekcredits bij registratie</div><div className="plan-rule" /><p className="plan-check"><Check aria-hidden="true" size={14} /> Zoek bedrijven per branche en plaats</p><p className="plan-check"><Check aria-hidden="true" size={14} /> Schakel Strikt S+ in voor exacte branche- en contactmatches</p><p className="plan-check"><Check aria-hidden="true" size={14} /> Beheer status, notities en opvolging</p><p className="plan-check"><Check aria-hidden="true" size={14} /> Exporteer je CRM-lijst als CSV</p><div className="plan-action"><Link className="button button-dark" href="/register">Start gratis <ArrowRight aria-hidden="true" size={14} /></Link></div></article>
          <article className="price-plan"><span className="plan-name">Open data</span><div className="plan-credits pricing-copy-heading">Gebouwd op OpenStreetMap</div><div className="plan-rule" /><p className="plan-check">Geen Google Places-sleutel of abonnement nodig om te zoeken.</p><p className="plan-check">S+ vereist een exacte branchetag, telefoon en e-mail, zonder websitevermelding in OSM.</p><p className="plan-check">Geen websitevermelding bewijst niet dat er nergens een site bestaat.</p></article>
          <article className="price-plan"><span className="plan-name">Eerlijk over dekking</span><div className="plan-credits pricing-copy-heading">Een shortlist, geen verrijkte database</div><div className="plan-rule" /><p className="plan-check">Open kaartdata verschilt per plaats en branche.</p><p className="plan-check">Openbare contactgegevens bewijzen niet dat een bedrijf nog actief is.</p><p className="plan-check">Publieke zoekdiensten zijn gedeeld en hebben fair-use-limieten.</p></article>
        </div>
      </div></section>
      <footer className="footer"><div className="shell footer-inner"><Link className="brand" href="/"><span className="brand-mark"><Sparkles aria-hidden="true" size={15} /></span><span>B2B Lead Finder</span></Link><span>Gemaakt voor betere gesprekken.</span></div></footer>
    </main>
  );
}
