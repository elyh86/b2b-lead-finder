import { ArrowDown, ArrowRight, ArrowUpRight, Check, MapPin, Search, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { CheckoutButton } from "@/components/checkout-button";

export default function Home() {
  return (
    <main>
      <header className="topbar">
        <div className="topbar-inner">
          <Link aria-label="B2B Lead Finder home" className="brand" href="/"><span className="brand-mark"><Search aria-hidden="true" size={16} /></span><span>B2B Lead Finder</span></Link>
          <nav aria-label="Hoofdnavigatie" className="nav-links"><a className="nav-pricing" href="#how-it-works">Zo werkt het</a><a className="nav-pricing" href="#pricing">Prijzen</a><Link href="/login">Inloggen</Link><Link className="button button-dark button-small" href="/register">Start gratis <ArrowUpRight aria-hidden="true" size={14} /></Link></nav>
        </div>
      </header>
      <section className="hero">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <span className="eyebrow hero-kicker">Voor agencies en sales teams</span>
            <h1 className="display">Goede leads zitten in <em>de details.</em></h1>
            <p>Vind lokale bedrijven die online kansen laten liggen. Scan een regio, ontdek hun digitale gezondheid en begin het gesprek met inzicht.</p>
            <div className="hero-actions"><Link className="button button-dark" href="/register">Vind je eerste leads <ArrowRight aria-hidden="true" size={16} /></Link><a className="button button-outline" href="#how-it-works">Ontdek de aanpak <ArrowDown aria-hidden="true" size={14} /></a></div>
            <div className="hero-note"><ShieldCheck aria-hidden="true" size={14} /> 50 gratis credits · Geen betaalkaart nodig</div>
          </div>
          <div aria-label="Voorbeeld van bedrijven gevonden in Utrecht" className="preview">
            <div className="preview-top"><span className="preview-title">Leads · Utrecht</span><span className="live-pill"><span className="live-dot" /> Scan voltooid</span></div>
            <div className="preview-query"><Search aria-hidden="true" size={13} /> <strong>Fysiotherapie</strong><span>·</span><MapPin aria-hidden="true" size={12} /> Utrecht</div>
            <table className="preview-table"><thead><tr><th>Bedrijf</th><th>Website</th><th>Reviews</th><th>Score</th></tr></thead><tbody>
              <tr><td>Fysio Centrum Oost</td><td className="dim">Ontbreekt</td><td>8</td><td><span className="score">20</span></td></tr>
              <tr><td>Beweegkracht Fysio</td><td>beweegkracht.nl</td><td>42</td><td><span className="score score-mid">80</span></td></tr>
              <tr><td>Praktijk De Brug</td><td className="dim">Ontbreekt</td><td>6</td><td><span className="score">20</span></td></tr>
            </tbody></table>
            <div className="preview-bottom"><span>20 bedrijven gevonden</span><strong>8 zonder website</strong></div>
          </div>
        </div>
      </section>
      <section aria-label="Voordelen" className="stats-band"><div className="shell stats-row">
        <div className="stat-item"><span className="stat-number">01</span><span className="stat-caption">Zoek op niche<br />en regio</span></div><div className="stat-item"><span className="stat-number">02</span><span className="stat-caption">Prioriteer met<br />digitale signalen</span></div><div className="stat-item"><span className="stat-number">03</span><span className="stat-caption">Exporteer je lijst<br />en start gesprekken</span></div>
      </div></section>
      <section className="section" id="how-it-works"><div className="shell">
        <div className="section-heading"><div><span className="eyebrow">Van zoekopdracht naar kans</span><h2 className="display">Minder zoeken.<br />Meer raak schieten.</h2></div><p>Een bruikbare lijst begint niet bij duizenden namen. Begin met bedrijven waar je aanbod echt verschil maakt.</p></div>
        <div className="workflow"><article className="workflow-item"><span className="workflow-number">01</span><h3>Kies je speelveld</h3><p>Combineer een branche met een stad, regio of postcode om lokale bedrijven te vinden.</p></article><article className="workflow-item"><span className="workflow-number">02</span><h3>Zie wat ontbreekt</h3><p>Bekijk website, telefoon, beoordeling en reviews. De gezondheidsscore helpt kansen rangschikken.</p></article><article className="workflow-item"><span className="workflow-number">03</span><h3>Neem de lijst mee</h3><p>Filter op bedrijven zonder website of download de resultaten als spreadsheet-vriendelijke CSV.</p></article></div>
      </div></section>
      <section className="pricing-section" id="pricing"><div className="shell">
        <div className="section-heading"><div><span className="eyebrow">Eenvoudig starten, opschalen wanneer nodig</span><h2 className="display">Jouw volgende klant<br />staat al op de kaart.</h2></div><p>Begin gratis. Kies een plan wanneer je klaar bent om meer regio&apos;s te verkennen.</p></div>
        <div className="pricing-grid">
          <article className="price-plan"><span className="plan-name">Gratis</span><div className="plan-price">€0 <small>/ altijd</small></div><div className="plan-credits">50 credits om te ontdekken</div><div className="plan-rule" /><p className="plan-check"><Check aria-hidden="true" size={14} /> Lead Finder en score</p><p className="plan-check"><Check aria-hidden="true" size={14} /> CSV-export</p><div className="plan-action"><Link className="button button-outline" href="/register">Account aanmaken <ArrowRight aria-hidden="true" size={14} /></Link></div></article>
          <article className="price-plan featured"><span className="plan-flag">Populair</span><span className="plan-name">Starter</span><div className="plan-price">€19 <small>/ maand</small></div><div className="plan-credits">1.000 credits per betaalde maand</div><div className="plan-rule" /><p className="plan-check"><Check aria-hidden="true" size={14} /> Alles uit Gratis</p><p className="plan-check"><Check aria-hidden="true" size={14} /> 1.000 credits per maand</p><div className="plan-action"><CheckoutButton label="Kies Starter" plan="STARTER" /></div></article>
          <article className="price-plan"><span className="plan-name">Pro</span><div className="plan-price">€49 <small>/ maand</small></div><div className="plan-credits">Onbeperkt zoeken</div><div className="plan-rule" /><p className="plan-check"><Check aria-hidden="true" size={14} /> Alles uit Starter</p><p className="plan-check"><Check aria-hidden="true" size={14} /> Onbeperkte scans</p><div className="plan-action"><CheckoutButton label="Kies Pro" plan="PRO" /></div></article>
        </div>
      </div></section>
      <footer className="footer"><div className="shell footer-inner"><Link className="brand" href="/"><span className="brand-mark"><Sparkles aria-hidden="true" size={15} /></span><span>B2B Lead Finder</span></Link><span>Gemaakt voor betere gesprekken.</span></div></footer>
    </main>
  );
}
