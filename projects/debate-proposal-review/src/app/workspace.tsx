"use client";

import { FormEvent, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { claims, passageById, sources, type Locale, type Verdict } from "@/lib/fixture";

type Theme = "dark" | "light";
type Outcome = "approve" | "reject" | "defer";
const localeKey = "dpr-locale";
const themeKey = "dpr-theme";
const preferenceEvent = "dpr-preference";

function subscribePreferences(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(preferenceEvent, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(preferenceEvent, callback);
  };
}
function getLocale(): Locale { return localStorage.getItem(localeKey) === "en" ? "en" : "es"; }
function getTheme(): Theme { return localStorage.getItem(themeKey) === "light" ? "light" : "dark"; }
function serverLocale(): Locale { return "es"; }
function serverTheme(): Theme { return "dark"; }
function setPreference(key: string, value: string) {
  localStorage.setItem(key, value);
  window.dispatchEvent(new Event(preferenceEvent));
}

const copy = {
  es: {
    skip: "Ir al contenido", eyebrow: "Espacio de revisión", example: "Ejemplo ficticio", local: "Maqueta local", nav: "Recorrido", sources: "Fuentes permitidas", sample: "Muestra sintética · no representa resultados reales", sourceCount: "3 documentos · 8 pasajes", openMenu: "Abrir navegación", closeMenu: "Cerrar navegación", closeSource: "Cerrar fuente", inspect: "Inspeccionar fuente", original: "Fragmento original", origin: "Documento sintético", back: "Volver a la revisión", theme: "Cambiar tema", language: "Idioma", heroLabel: "REVISIÓN 01 / SOPORTE INTERNO", title: "Borradores asistidos para la mesa de ayuda", subtitle: "¿Conviene aprobar una prueba de seis semanas con respuestas redactadas por IA y envío supervisado por personas?", proposed: "Propuesta", proposalText: "Cinco revisores usarían borradores para consultas rutinarias de restablecimiento de contraseña y estado de equipos. Cada respuesta requeriría revisión y envío humano. Se excluirían decisiones específicas de cuentas y datos sensibles.", duration: "6 semanas", team: "5 revisores", budget: "Tope: 500 unidades ficticias", reviewNote: "Los números y observaciones de este caso fueron inventados para probar la interfaz y el método de revisión.", position: "Perspectivas de ejemplo", positionNote: "Argumentos redactados manualmente para esta maqueta. La generación con IA todavía no está implementada.", for: "A favor", against: "En contra", forTitle: "Una prueba acotada puede dar una señal útil", forBody: "En el ejercicio ficticio, 18 de 24 borradores elegibles pudieron usarse después de editarlos. Un piloto delimitado permitiría observar el trabajo de revisión antes de ampliar el alcance.", againstTitle: "El costo y el control de errores siguen abiertos", againstBody: "Hubo borradores con instrucciones incorrectas y faltan costos de revisión, volumen esperado y controles de datos. El límite de gasto aún no está sustentado.", claimLedger: "Registro de afirmaciones", ledgerIntro: "Cada afirmación se contrasta con los pasajes permitidos. Un pasaje relacionado no prueba por sí solo una conclusión futura.", fact: "AFIRMACIÓN", status: "ESTADO", why: "Por qué", questions: "Preguntas abiertas", questionsIntro: "Datos que hacen falta para tomar una decisión mejor fundada.", q1: "¿Cuál es el costo total por solicitud elegible?", q1Detail: "Medir tiempo de revisión, implementación, controles y volumen mensual.", q2: "¿Qué errores podrían pasar la revisión humana?", q2Detail: "Definir un control verificable y registrar fallos durante el piloto.", q3: "¿Cómo se excluyen datos sensibles?", q3Detail: "Precisar detección, retención del proveedor y respuesta ante incidentes.", decision: "Decisión humana", decisionIntro: "La revisión informa tu criterio; no decide por vos.", outcome: "Resultado", approve: "Aprobar", reject: "Rechazar", defer: "Posponer", rationale: "Fundamento", rationalePlaceholder: "Explicá por qué tomás esta decisión…", conditions: "Condiciones (opcional)", conditionsPlaceholder: "Por ejemplo: validar costos y controles antes de iniciar", record: "Registrar decisión en esta maqueta", decisionSaved: "Decisión registrada en esta sesión", decisionLocal: "Vista previa local: la decisión no se envía ni se guarda en un servidor.", noOutcome: "Elegí un resultado para continuar.", stages: ["Propuesta", "Perspectivas", "Evidencia", "Preguntas", "Decisión"], verdicts: { supported: "Respaldada", contradicted: "Contradicha", insufficient: "Insuficiente" },
  },
  en: {
    skip: "Skip to content", eyebrow: "Review workspace", example: "Fictional example", local: "Local prototype", nav: "Review path", sources: "Permitted sources", sample: "Synthetic sample · not real-world results", sourceCount: "3 documents · 8 passages", openMenu: "Open navigation", closeMenu: "Close navigation", closeSource: "Close source", inspect: "Inspect source", original: "Original passage", origin: "Synthetic document", back: "Back to review", theme: "Switch theme", language: "Language", heroLabel: "REVIEW 01 / INTERNAL SUPPORT", title: "Assisted drafts for the help desk", subtitle: "Should a six-week trial of AI-drafted answers with human sending approval go ahead?", proposed: "Proposal", proposalText: "Five reviewers would use drafts for routine password-reset instructions and equipment-request status. Every response would require human review and sending. Account-specific decisions and sensitive data would be excluded.", duration: "6 weeks", team: "5 reviewers", budget: "Cap: 500 fictional units", reviewNote: "The figures and observations in this case were invented to test the interface and review method.", position: "Example perspectives", positionNote: "Arguments written by hand for this prototype. AI generation has not been implemented yet.", for: "Supporting", against: "Opposing", forTitle: "A bounded trial could provide a useful signal", forBody: "In the fictional exercise, 18 of 24 eligible drafts were usable after edits. A limited pilot could show how much review work is involved before expanding scope.", againstTitle: "Cost and error controls remain unresolved", againstBody: "Some drafts contained incorrect instructions. Reviewer cost, expected volume, and data controls are missing. The spend cap is not yet supported.", claimLedger: "Claim ledger", ledgerIntro: "Each claim is checked against permitted passages. A related passage alone does not prove a future conclusion.", fact: "CLAIM", status: "STATUS", why: "Reasoning", questions: "Open questions", questionsIntro: "Information needed for a better-grounded decision.", q1: "What is the total cost per eligible request?", q1Detail: "Measure reviewer time, implementation, controls, and monthly volume.", q2: "Which errors could pass human review?", q2Detail: "Define a verifiable control and log failures during the pilot.", q3: "How will sensitive data be excluded?", q3Detail: "Specify detection, provider retention, and incident response.", decision: "Human decision", decisionIntro: "The review informs your judgment; it does not decide for you.", outcome: "Outcome", approve: "Approve", reject: "Reject", defer: "Defer", rationale: "Rationale", rationalePlaceholder: "Explain why you are making this decision…", conditions: "Conditions (optional)", conditionsPlaceholder: "For example: validate costs and controls before starting", record: "Record decision in this prototype", decisionSaved: "Decision recorded for this session", decisionLocal: "Local preview: the decision is not sent or saved to a server.", noOutcome: "Choose an outcome to continue.", stages: ["Proposal", "Perspectives", "Evidence", "Questions", "Decision"], verdicts: { supported: "Supported", contradicted: "Contradicted", insufficient: "Insufficient" },
  },
} as const;

const sectionIds = ["proposal", "perspectives", "evidence", "questions", "decision"];

export function Workspace() {
  const locale = useSyncExternalStore(subscribePreferences, getLocale, serverLocale);
  const theme = useSyncExternalStore(subscribePreferences, getTheme, serverTheme);
  const t = copy[locale];
  const [selectedPassageId, setSelectedPassageId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [rationale, setRationale] = useState("");
  const [conditions, setConditions] = useState("");
  const [saved, setSaved] = useState<{ outcome: Outcome; rationale: string; conditions: string } | null>(null);
  const [formError, setFormError] = useState("");
  const lastTrigger = useRef<HTMLButtonElement | null>(null);
  const inspectorClose = useRef<HTMLButtonElement | null>(null);
  const selectedPassage = selectedPassageId ? passageById.get(selectedPassageId) : undefined;
  const selectedSource = selectedPassage ? sources.find((source) => source.id === selectedPassage.sourceId) : undefined;

  useEffect(() => { document.documentElement.lang = locale; document.documentElement.dataset.theme = theme; }, [locale, theme]);
  useEffect(() => {
    if (!selectedPassageId) return;
    inspectorClose.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") { setSelectedPassageId(null); lastTrigger.current?.focus(); } };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedPassageId]);

  function openSource(id: string, trigger: HTMLButtonElement) { lastTrigger.current = trigger; setSelectedPassageId(id); setMenuOpen(false); }
  function closeSource() { setSelectedPassageId(null); lastTrigger.current?.focus(); }
  function submitDecision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!outcome) { setFormError(t.noOutcome); return; }
    if (!rationale.trim()) return;
    setSaved({ outcome, rationale: rationale.trim(), conditions: conditions.trim() });
    setFormError("");
  }
  function citation(id: string, number: number) {
    return <button key={id} type="button" className="citation" aria-label={`${t.inspect}: ${id}`} onClick={(event) => openSource(id, event.currentTarget)}>[{number}]</button>;
  }

  return <div className="app-shell" data-theme={theme}>
    <a className="skip-link" href="#main-content">{t.skip}</a>
    {menuOpen && <button className="mobile-scrim" aria-label={t.closeMenu} onClick={() => setMenuOpen(false)} />}
    <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`} aria-label={t.nav}>
      <div className="brand"><span className="brand-symbol" aria-hidden="true">✳</span><span className="brand-copy"><strong>Argument</strong><small>PROPOSAL REVIEW</small></span><button className="rail-close" onClick={() => setMenuOpen(false)} aria-label={t.closeMenu}>×</button></div>
      <div className="sidebar-body">
        <div className="rail-label">{t.nav}</div>
        <nav className="stage-nav" aria-label={t.nav}>{sectionIds.map((id, index) => <a key={id} href={`#${id}`} onClick={() => setMenuOpen(false)}><span className="stage-index">0{index + 1}</span><span>{t.stages[index]}</span>{index === 0 && <span className="stage-current" aria-hidden="true" />}</a>)}</nav>
        <div className="rail-divider" />
        <div className="rail-label rail-source-label">{t.sources}<span>03</span></div>
        <div className="source-list">{sources.map((source, index) => <button className="source-item" key={source.id} onClick={(event) => openSource(source.passages[0].id, event.currentTarget)}><span className="source-icon" aria-hidden="true">▤</span><span><strong>{source.title[locale]}</strong><small>{source.id}</small></span><span className="source-arrow" aria-hidden="true">↗</span><span className="sr-only">{t.inspect} {index + 1}</span></button>)}</div>
      </div>
      <div className="sidebar-foot"><span className="status-dot" />{t.local}<small>{t.sourceCount}</small></div>
    </aside>

    <div className="main-column">
      <header className="topbar"><button className="menu-toggle" onClick={() => setMenuOpen(true)} aria-label={t.openMenu}>☰</button><span className="topbar-crumb">{t.eyebrow} <span>/</span> <strong>01</strong></span><div className="topbar-actions"><span className="topbar-demo"><span className="status-dot" />{t.example}</span><div className="locale-switch" role="group" aria-label={t.language}><button className={locale === "es" ? "active" : ""} aria-pressed={locale === "es"} onClick={() => setPreference(localeKey, "es")}>ES</button><button className={locale === "en" ? "active" : ""} aria-pressed={locale === "en"} onClick={() => setPreference(localeKey, "en")}>EN</button></div><button className="theme-toggle" onClick={() => setPreference(themeKey, theme === "dark" ? "light" : "dark")} aria-label={t.theme} title={t.theme}>{theme === "dark" ? "☼" : "☾"}</button></div></header>
      <main id="main-content" className="review-main"><div className="review-content">
        <section id="proposal" className="hero section-anchor" aria-labelledby="page-title"><div className="hero-kicker"><span className="hero-dash" />{t.heroLabel}</div><h1 id="page-title">{t.title}</h1><p className="hero-subtitle">{t.subtitle}</p><div className="hero-meta"><span>{t.duration}</span><span>{t.team}</span><span>{t.budget}</span></div></section>
        <div className="fixture-banner"><span className="fixture-icon" aria-hidden="true">◇</span><span><strong>{t.example}</strong> · {t.reviewNote}</span></div>
        <section className="content-section proposal-section" aria-labelledby="proposal-heading"><div className="section-heading"><span className="section-number">01 /</span><h2 id="proposal-heading">{t.proposed}</h2></div><p className="body-copy">{t.proposalText}</p><div className="scope-strip"><span className="scope-mark">↳</span>{t.sample}</div></section>
        <section id="perspectives" className="content-section section-anchor" aria-labelledby="perspectives-heading"><div className="section-heading"><span className="section-number">02 /</span><h2 id="perspectives-heading">{t.position}</h2></div><p className="section-lead">{t.positionNote}</p><div className="arguments"><article className="argument-card"><span className="argument-tag supporting"><span className="argument-glyph">↗</span>{t.for}</span><h3>{t.forTitle}</h3><p>{t.forBody}</p><div className="argument-citations">{citation("PILOT-01:P3", 1)}</div></article><article className="argument-card"><span className="argument-tag opposing"><span className="argument-glyph">↘</span>{t.against}</span><h3>{t.againstTitle}</h3><p>{t.againstBody}</p><div className="argument-citations">{citation("RISK-01:P1", 2)}{citation("COST-01:P1", 3)}</div></article></div></section>
        <section id="evidence" className="content-section section-anchor" aria-labelledby="evidence-heading"><div className="section-heading"><span className="section-number">03 /</span><h2 id="evidence-heading">{t.claimLedger}</h2><span className="heading-count">05</span></div><p className="section-lead">{t.ledgerIntro}</p><div className="claim-ledger"><div className="ledger-head"><span>{t.fact}</span><span>{t.status}</span></div>{claims.map((claim) => <article className="claim-row" key={claim.id}><div className="claim-top"><span className="claim-id">{claim.id}</span><span className={`verdict verdict-${claim.verdict}`}><span className="verdict-symbol" aria-hidden="true">{verdictSymbol(claim.verdict)}</span>{t.verdicts[claim.verdict]}</span></div><h3>{claim.text[locale]}</h3><div className="claim-bottom"><span className="claim-citations">{claim.passageIds.map((id, index) => citation(id, index + 1))}</span><details><summary>{t.why}<span aria-hidden="true">⌄</span></summary><p>{claim.rationale[locale]}</p></details></div></article>)}</div></section>
        <section id="questions" className="content-section section-anchor" aria-labelledby="questions-heading"><div className="section-heading"><span className="section-number">04 /</span><h2 id="questions-heading">{t.questions}</h2><span className="heading-count">03</span></div><p className="section-lead">{t.questionsIntro}</p><div className="question-list">{[[t.q1,t.q1Detail],[t.q2,t.q2Detail],[t.q3,t.q3Detail]].map(([question, detail], index) => <article className="question-row" key={question}><span className="question-index">0{index + 1}</span><div><h3>{question}</h3><p>{detail}</p></div><span aria-hidden="true" className="question-arrow">↗</span></article>)}</div></section>
        <section id="decision" className="content-section decision-section section-anchor" aria-labelledby="decision-heading"><div className="decision-heading"><span className="decision-icon" aria-hidden="true">✳</span><div><div className="section-heading"><span className="section-number">05 /</span><h2 id="decision-heading">{t.decision}</h2></div><p>{t.decisionIntro}</p></div></div><form onSubmit={submitDecision}><fieldset><legend>{t.outcome}</legend><div className="outcome-options">{(["approve","reject","defer"] as const).map((value) => <label key={value} className={outcome === value ? "outcome-option selected" : "outcome-option"}><input type="radio" name="outcome" value={value} checked={outcome === value} onChange={() => { setOutcome(value); setFormError(""); }} /><span>{t[value]}</span><span aria-hidden="true">↗</span></label>)}</div>{formError && <p className="form-error" role="alert">{formError}</p>}</fieldset><label className="field-label" htmlFor="rationale">{t.rationale}<span>*</span></label><textarea id="rationale" value={rationale} onChange={(event) => setRationale(event.target.value)} placeholder={t.rationalePlaceholder} required rows={3} /><label className="field-label" htmlFor="conditions">{t.conditions}</label><input id="conditions" value={conditions} onChange={(event) => setConditions(event.target.value)} placeholder={t.conditionsPlaceholder} /><div className="form-footer"><span>{t.decisionLocal}</span><button className="primary-button" type="submit">{t.record}<span aria-hidden="true">↗</span></button></div></form>{saved && <div className="decision-confirmation" role="status"><strong>{t.decisionSaved} · {t[saved.outcome]}</strong><p>{saved.rationale}</p>{saved.conditions && <small>{saved.conditions}</small>}</div>}</section>
        <footer className="review-footer"><span>ARGUMENT / 01</span><span>{t.sample}</span></footer>
      </div></main>
    </div>

    {selectedPassage && selectedSource && <><button className="inspector-scrim" aria-label={t.closeSource} onClick={closeSource} /><aside className="source-inspector" aria-label={`${t.original}: ${selectedSource.title[locale]}`}><div className="inspector-top"><span className="inspector-eyebrow">{t.original}</span><button ref={inspectorClose} className="inspector-close" onClick={closeSource} aria-label={t.closeSource}>×</button></div><div className="inspector-document"><span className="inspector-file-icon" aria-hidden="true">▤</span><div><h2>{selectedSource.title[locale]}</h2><p>{selectedSource.id} · {t.origin}</p></div></div><div className="inspector-locator">{selectedPassage.id}<span>{selectedPassage.locator}</span></div><blockquote lang="en">{selectedPassage.text}</blockquote><div className="inspector-bottom"><span>{t.sample}</span><button onClick={closeSource}>← {t.back}</button></div></aside></>}
  </div>;
}

function verdictSymbol(verdict: Verdict) { return verdict === "supported" ? "✓" : verdict === "contradicted" ? "×" : "?"; }
