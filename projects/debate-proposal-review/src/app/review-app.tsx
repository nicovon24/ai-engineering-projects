"use client";
\n/* eslint-disable @next/next/no-html-link-for-pages */
\n
\nimport { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
\nimport { useRouter } from "next/navigation";
\nimport type { Locale, ReviewRecord } from "../lib/types";
\nimport type { ReviewSnapshot } from "../lib/review-contract";
\nimport "./app-ui.css";
\n
\ntype Mode = "chat" | "history" | "review";
\ntype Outcome = "approve" | "reject" | "defer";
\ntype Passage = ReviewSnapshot["sources"][number]["passages"][number];
\ntype DraftClaim = { text: string; kind: "factual" | "value_judgment" };
\ntype DraftArgument = { text: string; claims: DraftClaim[] };
\n
\nfunction draftClaims(value: unknown): DraftClaim[] {
\n  if (!value || typeof value !== "object" || !("claims" in value) || !Array.isArray(value.claims)) return [];
\n  return value.claims.filter((item): item is DraftClaim => Boolean(item) && typeof item === "object" && typeof item.text === "string" && (item.kind === "factual" || item.kind === "value_judgment"));
\n}
\n
\nfunction draftArguments(value: unknown): DraftArgument[] {
\n  if (!value || typeof value !== "object" || !("arguments" in value) || !Array.isArray(value.arguments)) return [];
\n  return value.arguments.filter((item): item is DraftArgument => Boolean(item) && typeof item === "object" && typeof item.text === "string" && Array.isArray(item.claims)).map((item) => ({ text: item.text, claims: draftClaims({ claims: item.claims }) }));
\n}
\n
\nconst words = {
\n  es: {
\n    skip: "Ir al contenido", home: "Nueva revisión", history: "Revisiones guardadas", example: "Ejemplo ficticio", theme: "Cambiar tema", language: "Idioma", menu: "Abrir navegación", closeMenu: "Cerrar navegación", title: "Una decisión merece una revisión clara.", intro: "Contá qué querés decidir. Te ayudaremos a precisar la propuesta antes de contrastar argumentos y fuentes.", proposal: "Tu propuesta", proposalPlaceholder: "Describí la decisión, las opciones y el contexto que ya conocés…", send: "Enviar mensaje", sending: "Consultando…", consent: "Autorizo enviar el contenido de esta revisión a Groq para generar respuestas. Los datos se procesan fuera de este dispositivo.", consentNeeded: "Autorizá el procesamiento externo antes de enviar el mensaje.", noProvider: "La generación real no está disponible porque falta configurar Groq. Podés preparar una propuesta y explorar el ejemplo ficticio.", sources: "Fuentes autorizadas", sourceHint: "Agregá textos o archivos que podamos usar como evidencia. Se guardan en este dispositivo.", sourceTitle: "Título de la fuente", sourceText: "Texto de la fuente", addText: "Agregar texto", addFile: "Agregar archivo", limits: "Hasta 5 fuentes · 5 MB por archivo · TXT, MD, PDF o DOCX", summary: "Resumen editable", summaryHint: "Revisá el título y el resumen antes de iniciar la revisión.", proposalTitle: "Título de la propuesta", proposalSummary: "Resumen de la propuesta", generate: "Generar revisión", generating: "Generando etapa…", review: "Revisión", status: "Estado", retry: "Continuar o reintentar", draft: "Borrador", none: "Todavía no hay revisiones guardadas.", open: "Abrir revisión", delete: "Eliminar revisión", deleteConfirm: "¿Eliminar esta revisión y sus datos locales?", latest: "Actualizada", arguments: "Argumentos", supporting: "A favor", opposing: "En contra", claims: "Afirmaciones", factual: "Factual", value_judgment: "Juicio de valor", verdicts: "Veredictos de evidencia", supported: "Respaldada", contradicted: "Contradicha", mixed: "Mixta", insufficient: "Insuficiente", inspect: "Inspeccionar pasaje", original: "Pasaje original", close: "Cerrar", questions: "Preguntas abiertas", decision: "Decisión humana", decisionHint: "La conclusión te pertenece. La revisión no elige por vos.", approve: "Aprobar", reject: "Rechazar", defer: "Posponer", rationale: "Fundamento", conditions: "Condiciones (opcional)", saveDecision: "Guardar decisión", correctDecision: "Corregir decisión", saved: "Decisión guardada", failure: "No se pudo completar la operación. Revisá la entrada e intentá de nuevo.", incomplete: "La revisión está incompleta. Podés continuar desde la última etapa.", noEvidence: "No se encontró un pasaje relevante.", noClaims: "Las afirmaciones aparecerán cuando avance la revisión.", noArguments: "Los argumentos aparecerán cuando avance la revisión.", sourceLimit: "Se alcanzó el límite de fuentes.", external: "Procesamiento externo",
\n  },
\n  en: {
\n    skip: "Skip to content", home: "New review", history: "Saved reviews", example: "Fictional example", theme: "Switch theme", language: "Language", menu: "Open navigation", closeMenu: "Close navigation", title: "A decision deserves a clear review.", intro: "Describe what you need to decide. We will clarify the proposal before comparing arguments and sources.", proposal: "Your proposal", proposalPlaceholder: "Describe the decision, options, and context you already know…", send: "Send message", sending: "Working…", consent: "I authorize sending this review content to Groq to generate responses. Data is processed outside this device.", consentNeeded: "Authorize external processing before sending your message.", noProvider: "Real generation is unavailable because Groq is not configured. You can prepare a proposal and explore the fictional example.", sources: "Authorized sources", sourceHint: "Add text or files we may use as evidence. They are saved on this device.", sourceTitle: "Source title", sourceText: "Source text", addText: "Add text", addFile: "Add file", limits: "Up to 5 sources · 5 MB per file · TXT, MD, PDF, or DOCX", summary: "Editable summary", summaryHint: "Review the title and summary before starting the review.", proposalTitle: "Proposal title", proposalSummary: "Proposal summary", generate: "Generate review", generating: "Generating stage…", review: "Review", status: "Status", retry: "Continue or retry", draft: "Draft", none: "No saved reviews yet.", open: "Open review", delete: "Delete review", deleteConfirm: "Delete this review and its local data?", latest: "Updated", arguments: "Arguments", supporting: "Supporting", opposing: "Opposing", claims: "Claims", factual: "Factual", value_judgment: "Value judgment", verdicts: "Evidence verdicts", supported: "Supported", contradicted: "Contradicted", mixed: "Mixed", insufficient: "Insufficient", inspect: "Inspect passage", original: "Original passage", close: "Close", questions: "Open questions", decision: "Human decision", decisionHint: "The conclusion belongs to you. The review does not choose for you.", approve: "Approve", reject: "Reject", defer: "Defer", rationale: "Rationale", conditions: "Conditions (optional)", saveDecision: "Save decision", correctDecision: "Correct decision", saved: "Decision saved", failure: "The operation could not be completed. Check your input and try again.", incomplete: "The review is incomplete. You can continue from the last stage.", noEvidence: "No relevant passage was found.", noClaims: "Claims will appear as the review progresses.", noArguments: "Arguments will appear as the review progresses.", sourceLimit: "The source limit has been reached.", external: "External processing",
\n  },
\n} as const;
\n
\nconst stageLabels: Record<Locale, Record<ReviewRecord["stage"], string>> = {
\n  es: { draft: "Preparación", claims: "Afirmaciones", supporting: "A favor", opposing: "En contra", evidence: "Evidencia", synthesis: "Síntesis", complete: "Completa" },
\n  en: { draft: "Preparation", claims: "Claims", supporting: "Supporting", opposing: "Opposing", evidence: "Evidence", synthesis: "Synthesis", complete: "Complete" },
\n};
\n
\nasync function api<T>(url: string, options?: RequestInit): Promise<T> {
\n  const response = await fetch(url, options);
\n  const body = await response.json().catch(() => ({}));
\n  if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "REQUEST_FAILED");
\n  return body as T;
\n}
\nconst json = (value: unknown) => ({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) });
\nconst codeOf = (cause: unknown) => cause instanceof Error ? cause.message : "request_failed";
\n
\nfunction explainError(code: string, locale: Locale): string {
\n  const es: Record<string, string> = {
\n    consent_required: "Autorizá el procesamiento externo antes de continuar.",
\n    ocr_required: "Este PDF no contiene texto digital. Aplicá OCR y volvé a subirlo.",
\n    provider_limited: "Groq alcanzó su límite temporal. Esperá un momento y reintentá esta etapa.",
\n    provider_not_configured: "Groq no está configurado. Podés guardar el borrador y explorar el ejemplo ficticio.",
\n    provider_unavailable: "Groq no responde. Tu revisión quedó guardada; reintentá esta etapa.",
\n    provider_invalid_output: "La respuesta de Groq no tuvo el formato esperado. Reintentá esta etapa.",
\n    invalid_output: "La respuesta no tuvo el formato esperado. Reintentá esta etapa.",
\n    too_large: "Se superó un límite: 5 fuentes, 5 MB por archivo, 40 000 caracteres por fuente u 80 000 en total.",
\n    source_limit: "Se alcanzó el límite de 5 fuentes.",
\n    invalid_stage: "Esta revisión ya avanzó. Abrila desde Revisiones guardadas para continuar.",
\n    unsupported_type: "Usá un archivo TXT, MD, PDF o DOCX.",
\n    invalid_text: "El archivo no es texto UTF-8 válido. Revisá el formato y volvé a subirlo.",
\n    invalid_file: "No se pudo leer el archivo. Revisá que no esté dañado y volvé a subirlo.",
\n    empty_source: "La fuente está vacía. Agregá texto antes de guardarla.",
\n    not_found: "No se encontró la revisión. Abrí Revisiones guardadas para elegir otra.",
\n  };
\n  const en: Record<string, string> = {
\n    consent_required: "Authorize external processing before continuing.",
\n    ocr_required: "This PDF has no digital text. Apply OCR, then upload it again.",
\n    provider_limited: "Groq reached a temporary limit. Wait a moment, then retry this stage.",
\n    provider_not_configured: "Groq is not configured. You can save a draft and explore the fictional example.",
\n    provider_unavailable: "Groq is unavailable. Your review is saved; retry this stage.",
\n    provider_invalid_output: "Groq returned an unexpected format. Retry this stage.",
\n    invalid_output: "The response had an unexpected format. Retry this stage.",
\n    too_large: "A limit was exceeded: 5 sources, 5 MB per file, 40,000 characters per source, or 80,000 total.",
\n    source_limit: "The 5-source limit has been reached.",
\n    invalid_stage: "This review has advanced. Open it from Saved reviews to continue.",
\n    unsupported_type: "Use a TXT, MD, PDF, or DOCX file.",
\n    invalid_text: "The file is not valid UTF-8 text. Check the format and upload it again.",
\n    invalid_file: "The file could not be read. Check that it is not damaged and upload it again.",
\n    empty_source: "The source is empty. Add text before saving it.",
\n    not_found: "The review was not found. Open Saved reviews to choose another.",
\n  };
\n  const messages = locale === "es" ? es : en;
\n  if (code.startsWith("provider_") && !messages[code]) return messages.provider_unavailable;
\n  return messages[code] || (locale === "es" ? "No se pudo completar la operación. Revisá la entrada e intentá de nuevo." : "The operation could not be completed. Check your input and try again.");
\n}
\n
\nexport function ReviewApp({ mode, id, providerReady }: { mode: Mode; id?: string; providerReady: boolean }) {
\n  const router = useRouter();
\n  const [locale, setLocale] = useState<Locale>("es");
\n  const [theme, setTheme] = useState<"dark" | "light">("dark");
\n  const [menuOpen, setMenuOpen] = useState(false);
\n  const [record, setRecord] = useState<ReviewRecord | null>(null);
\n  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
\n  const [loading, setLoading] = useState(mode !== "chat");
\n  const [busy, setBusy] = useState(false);
\n  const [error, setError] = useState("");
\n  const [consent, setConsent] = useState(false);
\n  const [message, setMessage] = useState("");
\n  const [sourceTitle, setSourceTitle] = useState("");
\n  const [sourceText, setSourceText] = useState("");
\n  const [title, setTitle] = useState("");
\n  const [summary, setSummary] = useState("");
\n  const [outcome, setOutcome] = useState<Outcome | "">("");
\n  const [rationale, setRationale] = useState("");
\n  const [conditions, setConditions] = useState("");
\n  const [selected, setSelected] = useState<Passage | null>(null);
\n  const dialog = useRef<HTMLDialogElement>(null);
\n  const trigger = useRef<HTMLButtonElement>(null);
\n  const started = useRef(false);
\n  const t = words[locale];
\n
\n  useEffect(() => {
\n    const storedLocale = localStorage.getItem("dpr-locale");
\n    const storedTheme = localStorage.getItem("dpr-theme");
\n    queueMicrotask(() => { if (storedLocale === "en") setLocale("en"); if (storedTheme === "light") setTheme("light"); });
\n  }, []);
\n  useEffect(() => { document.documentElement.lang = locale; document.documentElement.dataset.theme = theme; }, [locale, theme]);
\n  useEffect(() => {
\n    let active = true;
\n    const draftId = mode === "chat" ? new URLSearchParams(window.location.search).get("draft") : id;
\n    if (mode === "history") {
\n      api<{ reviews: ReviewRecord[] }>("/api/reviews").then(({ reviews }) => { if (active) setReviews(reviews); }).catch((cause) => { if (active) setError(codeOf(cause)); }).finally(() => { if (active) setLoading(false); });
\n    } else if (draftId) {
\n      api<{ review: ReviewRecord }>(`/api/reviews/${encodeURIComponent(draftId)}`).then(({ review }) => { if (active) { if (mode === "chat" && review.stage !== "draft") router.replace(`/reviews/${review.id}`); else setRecord(review); } }).catch((cause) => { if (active) setError(codeOf(cause)); }).finally(() => { if (active) setLoading(false); });
\n    }
\n    return () => { active = false; };
\n  }, [mode, id, router]);
\n  useEffect(() => {
\n    if (!record) return;
\n    queueMicrotask(() => {
\n      setTitle((current) => current || record.proposal.title);
\n      setSummary((current) => current || record.proposal.summary);
\n      setConsent((current) => current || Boolean(record.consentAt));
\n      if (record.decision) { setOutcome(record.decision.outcome); setRationale(record.decision.rationale); setConditions(record.decision.conditions); }
\n    });
\n  }, [record]);
\n  useEffect(() => {
\n    if (selected && dialog.current && !dialog.current.open) dialog.current.showModal();
\n  }, [selected]);
\n
\n  const generateStages = useCallback(async (reviewId: string) => {
\n    if (!providerReady) return;
\n    setBusy(true); setError("");
\n    try {
\n      for (let count = 0; count < 7; count++) {
\n        const { review } = await api<{ review: ReviewRecord }>(`/api/reviews/${reviewId}/generate`, json({}));
\n        setRecord(review);
\n        if (review.stage === "complete" || review.error) break;
\n      }
\n    } catch (cause) { setError(codeOf(cause)); }
\n    finally { setBusy(false); }
\n  }, [providerReady]);
\n  useEffect(() => {
\n    if (mode !== "review" || !id || !record || started.current || !new URLSearchParams(window.location.search).has("run")) return;
\n    started.current = true;
\n    window.history.replaceState({}, "", `/reviews/${id}`);
\n    void generateStages(id);
\n  }, [mode, id, record, generateStages]);
\n
\n  function chooseLocale(next: Locale) { setLocale(next); localStorage.setItem("dpr-locale", next); }
\n  function chooseTheme() { const next = theme === "dark" ? "light" : "dark"; setTheme(next); localStorage.setItem("dpr-theme", next); }
\n  async function ensureDraft(): Promise<ReviewRecord> {
\n    if (record) return record;
\n    const created = await api<{ review: ReviewRecord }>("/api/reviews", json({ locale }));
\n    setRecord(created.review);
\n    window.history.replaceState({}, "", `/?draft=${created.review.id}`);
\n    return created.review;
\n  }
\n  async function sendMessage(event: FormEvent) {
\n    event.preventDefault();
\n    if (!message.trim() || busy) return;
\n    if (!consent) { setError("consent_required"); return; }
\n    if (!providerReady) { setError("provider_not_configured"); return; }
\n    setBusy(true); setError("");
\n    try {
\n      let current = await ensureDraft();
\n      const patched = await api<{ review: ReviewRecord }>(`/api/reviews/${current.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...(current.consentAt ? {} : { consent: true }), locale }) });
\n      current = patched.review; setRecord(current);
\n      const sent = await api<{ review: ReviewRecord }>(`/api/reviews/${current.id}/chat`, json({ message: message.trim() }));
\n      setRecord(sent.review); setTitle(sent.review.proposal.title); setSummary(sent.review.proposal.summary); setMessage("");
\n    } catch (cause) { setError(codeOf(cause)); }
\n    finally { setBusy(false); }
\n  }
\n  async function addSource(input: { title?: string; text?: string; file?: File }) {
\n    if (busy) return;
\n    if (record && record.sources.length >= 5) { setError("source_limit"); return; }
\n    setBusy(true); setError("");
\n    try {
\n      const current = await ensureDraft();
\n      let options: RequestInit;
\n      if (input.file) {
\n        if (input.file.size > 5 * 1024 * 1024) { setError("too_large"); return; }
\n        const data = new FormData(); data.append("file", input.file); if (input.title) data.append("title", input.title);
\n        options = { method: "POST", body: data };
\n      } else options = json({ title: input.title, text: input.text });
\n      const added = await api<{ review: ReviewRecord }>(`/api/reviews/${current.id}/sources`, options);
\n      setRecord(added.review); setSourceText(""); setSourceTitle("");
\n    } catch (cause) { setError(codeOf(cause)); }
\n    finally { setBusy(false); }
\n  }
\n  async function startReview() {
\n    if (busy || !providerReady) return;
\n    if (!consent) { setError("consent_required"); return; }
\n    setBusy(true); setError("");
\n    try {
\n      const current = await ensureDraft();
\n      await api<{ review: ReviewRecord }>(`/api/reviews/${current.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ locale, consent: true, proposal: { title: title.trim(), summary: summary.trim() } }) });
\n      router.push(`/reviews/${current.id}?run=1`);
\n    } catch (cause) { setError(codeOf(cause)); setBusy(false); }
\n  }
\n  async function saveDraft() {
\n    if (busy) return;
\n    setBusy(true); setError("");
\n    try {
\n      const current = await ensureDraft();
\n      const saved = await api<{ review: ReviewRecord }>(`/api/reviews/${current.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ locale, proposal: { title: title.trim(), summary: summary.trim() } }) });
\n      setRecord(saved.review);
\n    } catch (cause) { setError(codeOf(cause)); }
\n    finally { setBusy(false); }
\n  }
\n  async function deleteRecord(reviewId: string) {
\n    if (!window.confirm(t.deleteConfirm)) return;
\n    setBusy(true); setError("");
\n    try { await api(`/api/reviews/${reviewId}`, { method: "DELETE" }); setReviews((items) => items.filter((item) => item.id !== reviewId)); }
\n    catch (cause) { setError(codeOf(cause)); }
\n    finally { setBusy(false); }
\n  }
\n  async function saveDecision(event: FormEvent) {
\n    event.preventDefault();
\n    if (!record || !outcome || !rationale.trim()) return;
\n    setBusy(true); setError("");
\n    try {
\n      const saved = await api<{ review: ReviewRecord }>(`/api/reviews/${record.id}/decision`, json({ outcome, rationale: rationale.trim(), conditions: conditions.trim() }));
\n      setRecord(saved.review);
\n    } catch (cause) { setError(codeOf(cause)); }
\n    finally { setBusy(false); }
\n  }
\n  function openPassage(passage: Passage, button: HTMLButtonElement) { trigger.current = button; setSelected(passage); }
\n  function closePassage() { dialog.current?.close(); setSelected(null); trigger.current?.focus(); }
\n  function citation(passageId: string) {
\n    const passage = record?.sources.flatMap((source) => source.passages).find((item) => item.id === passageId);
\n    if (!passage) return null;
\n    return <button key={passageId} type="button" className="new-citation" onClick={(event) => openPassage(passage, event.currentTarget)} aria-label={`${t.inspect}: ${passageId}`}>{passageId}</button>;
\n  }
\n
\n  const snapshot = record?.snapshot;
\n  const initialClaims = !snapshot ? draftClaims(record?.stageOutputs.claims) : [];
\n  const supportingDrafts = !snapshot ? draftArguments(record?.stageOutputs.supporting) : [];
\n  const opposingDrafts = !snapshot ? draftArguments(record?.stageOutputs.opposing) : [];
\n  const currentSource = selected && record?.sources.find((source) => source.id === selected.sourceId);
\n  const disabled = busy || Boolean(record && record.stage !== "draft");
\n  return <div className="app-shell new-app" data-theme={theme}>
\n    <a className="skip-link" href="#main-content">{t.skip}</a>
\n    {menuOpen && <button className="new-scrim" aria-label={t.closeMenu} onClick={() => setMenuOpen(false)} />}
\n    <aside className={`new-rail ${menuOpen ? "new-rail-open" : ""}`} aria-label={t.menu}>
\n      <a className="new-brand" href="/"><span className="new-brand-mark" aria-hidden="true">✳</span><span><strong>Argument</strong><small>PROPOSAL REVIEW</small></span></a>
\n      <nav className="new-nav" aria-label={t.menu}>
\n        <a href="/" aria-current={mode === "chat" ? "page" : undefined}>{t.home}</a>
\n        <a href="/reviews" aria-current={mode === "history" ? "page" : undefined}>{t.history}</a>
\n        <a href="/example">{t.example}</a>
\n      </nav>
\n      <p className="new-rail-note">{locale === "es" ? "La evidencia informa. La decisión es humana." : "Evidence informs. The decision is human."}</p>
\n    </aside>
\n    <div className="new-main-column">
\n      <header className="new-topbar"><button type="button" className="new-menu" onClick={() => setMenuOpen(true)} aria-label={t.menu}>☰</button><span className="new-topbar-title">{mode === "chat" ? t.home : mode === "history" ? t.history : t.review}</span><div className="new-actions"><div className="locale-switch" role="group" aria-label={t.language}><button type="button" className={locale === "es" ? "active" : ""} aria-pressed={locale === "es"} onClick={() => chooseLocale("es")}>ES</button><button type="button" className={locale === "en" ? "active" : ""} aria-pressed={locale === "en"} onClick={() => chooseLocale("en")}>EN</button></div><button type="button" className="new-theme" onClick={chooseTheme} aria-label={t.theme}>{theme === "dark" ? "☼" : "☾"}</button></div></header>
\n      <main id="main-content" className="new-content">
\n        {error && <p className="new-error" role="alert">{explainError(error, locale)}</p>}
\n        {loading && <p className="new-loading" role="status">{locale === "es" ? "Cargando revisión…" : "Loading review…"}</p>}
\n        {mode === "chat" && !loading && <>
\n          <section className="new-intro"><h1>{t.title}</h1><p>{t.intro}</p></section>
\n          {!providerReady && <p className="new-notice" role="status">{t.noProvider} <a href="/example">{t.example}</a></p>}
\n          <section className="new-chat" aria-label={t.proposal}>
\n            {record?.messages.map((item) => <div key={item.id} className={`new-message new-message-${item.role}`}><span>{item.role === "user" ? (locale === "es" ? "Vos" : "You") : "Argument"}</span><p>{item.content}</p></div>)}
\n            {!record?.messages.length && <p className="new-chat-empty">{locale === "es" ? "Empezá por la decisión que tenés delante. Podés agregar fuentes después." : "Start with the decision in front of you. You can add sources afterward."}</p>}
\n            <form onSubmit={sendMessage}><label htmlFor="proposal-message">{t.proposal}</label><textarea id="proposal-message" value={message} onChange={(event) => setMessage(event.target.value)} placeholder={t.proposalPlaceholder} rows={4} maxLength={6000} disabled={busy} /><div className="new-chat-controls"><label className="new-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} disabled={busy} /><span>{t.consent}</span></label><button type="submit" className="new-primary" disabled={busy || !message.trim() || !providerReady}>{busy ? t.sending : t.send}</button></div></form>
\n          </section>
\n          <section className="new-section"><h2>{t.sources}</h2><p>{t.sourceHint}</p><div className="new-source-list">{record?.sources.map((source) => <div key={source.id} className="new-source-row"><strong>{source.title}</strong><span>{source.format.toUpperCase()} · {source.passages.length} {locale === "es" ? "pasajes" : "passages"}</span></div>)}</div><div className="new-source-entry"><label htmlFor="source-title">{t.sourceTitle}</label><input id="source-title" value={sourceTitle} onChange={(event) => setSourceTitle(event.target.value)} disabled={disabled} /><label htmlFor="source-text">{t.sourceText}</label><textarea id="source-text" rows={3} value={sourceText} onChange={(event) => setSourceText(event.target.value)} disabled={disabled} /><div className="new-source-actions"><button type="button" onClick={() => void addSource({ title: sourceTitle, text: sourceText })} disabled={disabled || !sourceText.trim() || (record?.sources.length ?? 0) >= 5}>{t.addText}</button><label className="new-file-label">{t.addFile}<input type="file" accept=".txt,.md,.pdf,.docx" disabled={disabled || (record?.sources.length ?? 0) >= 5} onChange={(event) => { const file = event.target.files?.[0]; if (file) void addSource({ title: sourceTitle, file }); event.target.value = ""; }} /></label></div><small>{t.limits}</small></div></section>
\n          <section className="new-section new-summary"><h2>{t.summary}</h2><p>{t.summaryHint}</p><label htmlFor="proposal-title">{t.proposalTitle}</label><input id="proposal-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} /><label htmlFor="proposal-summary">{t.proposalSummary}</label><textarea id="proposal-summary" value={summary} onChange={(event) => setSummary(event.target.value)} rows={6} maxLength={12000} /><div className="new-summary-actions"><button type="button" onClick={() => void saveDraft()} disabled={busy || !title.trim() || !summary.trim()}>{locale === "es" ? "Guardar borrador" : "Save draft"}</button><button type="button" className="new-primary" onClick={() => void startReview()} disabled={busy || !providerReady || !consent || !title.trim() || !summary.trim()}>{t.generate}</button></div></section>
\n        </>}
\n        {mode === "history" && !loading && <section className="new-history"><h1>{t.history}</h1>{reviews.length === 0 ? <p>{t.none}</p> : <div className="new-history-list">{reviews.map((item) => <article key={item.id}><div><h2><a href={item.stage === "draft" ? `/?draft=${item.id}` : `/reviews/${item.id}`}>{item.proposal.title || t.draft}</a></h2><p>{item.proposal.summary || stageLabels[locale][item.stage]}</p><small>{t.latest}: {new Date(item.updatedAt).toLocaleString(locale)}</small></div><button type="button" onClick={() => void deleteRecord(item.id)} disabled={busy}>{t.delete}</button></article>)}</div>}</section>}
\n        {mode === "review" && !loading && record && <>
\n          <section className="new-review-head"><h1>{record.proposal.title || t.review}</h1><p>{record.proposal.summary}</p><div className="new-stage"><span>{t.status}: <strong>{stageLabels[locale][record.stage]}</strong></span>{record.stage !== "complete" && <button type="button" onClick={() => void generateStages(record.id)} disabled={busy || !providerReady}>{busy ? t.generating : t.retry}</button>}</div><p className="new-analysis-note">{locale === "es" ? "Las afirmaciones y veredictos generados pueden estar equivocados. Inspeccioná los pasajes: algunas afirmaciones sin respaldo podrían no figurar en el registro." : "Generated claims and verdicts may be wrong. Inspect the passages: some unsupported assertions may be missing from the ledger."}</p>{record.error && <p className="new-error" role="alert">{t.incomplete}</p>}{!providerReady && <p className="new-notice">{t.noProvider}</p>}{record.locale !== locale && <p className="new-locale-note">{locale === "es" ? "Esta revisión se generó en otro idioma; el texto original se conserva." : "This review was generated in another language; its original text is preserved."}</p>}</section>
\n          <section className="new-section"><h2>{t.sources}</h2>{record.sources.map((source) => <div key={source.id} className="new-source-row"><strong>{source.title}</strong><span>{source.passages.length} {locale === "es" ? "pasajes" : "passages"}</span></div>)}</section>
\n          <section className="new-section"><h2>{t.arguments}</h2>{snapshot?.arguments.length ? snapshot.arguments.map((arg) => <article className="new-argument" key={arg.id}><span className={`new-perspective new-${arg.perspective}`}>{t[arg.perspective]}</span><p>{arg.text}</p><small>{arg.claimIds.join(" · ")}</small></article>) : supportingDrafts.length || opposingDrafts.length ? <><p className="new-provisional">{locale === "es" ? "Argumentos provisionales · todavía sin veredicto de evidencia" : "Provisional arguments · no evidence verdict yet"}</p>{([...[...supportingDrafts].map((arg) => ({ ...arg, perspective: "supporting" as const })), ...opposingDrafts.map((arg) => ({ ...arg, perspective: "opposing" as const }))]).map((arg, index) => <article className="new-argument" key={`${arg.perspective}-${index}`}><span className={`new-perspective new-${arg.perspective}`}>{t[arg.perspective]}</span><p>{arg.text}</p>{arg.claims.length > 0 && <ul className="new-draft-claims">{arg.claims.map((claim, claimIndex) => <li key={claimIndex}>{claim.text} <small>· {t[claim.kind]}</small></li>)}</ul>}</article>)}</> : <p>{t.noArguments}</p>}</section>
\n          <section className="new-section"><h2>{t.claims}</h2>{snapshot?.claims.length ? snapshot.claims.map((claim) => { const verdict = snapshot.verdicts.find((item) => item.claimId === claim.id); return <article className="new-claim" key={claim.id}><div><span>{claim.id} · {t[claim.kind]}</span>{verdict && <strong className={`new-verdict new-${verdict.status}`}>{t[verdict.status]}</strong>}</div><h3>{claim.text}</h3>{verdict && <><p>{verdict.rationale}</p><div className="new-evidence-groups">{verdict.supportingPassageIds.length > 0 && <div className="new-evidence-group"><strong>{locale === "es" ? "A favor de la afirmación" : "Supporting the claim"}</strong><div className="new-citations">{verdict.supportingPassageIds.map(citation)}</div></div>}{verdict.contradictingPassageIds.length > 0 && <div className="new-evidence-group"><strong>{locale === "es" ? "En contra de la afirmación" : "Contradicting the claim"}</strong><div className="new-citations">{verdict.contradictingPassageIds.map(citation)}</div></div>}{verdict.noRelevantPassage && <span>{t.noEvidence}</span>}</div></>}</article>; }) : initialClaims.length ? <><p className="new-provisional">{locale === "es" ? "Afirmaciones provisionales extraídas de la propuesta · todavía sin veredicto de evidencia" : "Provisional claims extracted from the proposal · no evidence verdict yet"}</p>{initialClaims.map((claim, index) => <article className="new-claim" key={index}><div><span>{t[claim.kind]}</span></div><h3>{claim.text}</h3></article>)}</> : <p>{t.noClaims}</p>}</section>
\n          {record.synthesis && <section className="new-section"><h2>{locale === "es" ? "Síntesis" : "Synthesis"}</h2><p>{record.synthesis.summary}</p><h3>{t.questions}</h3>{record.synthesis.questions.map((item, index) => <article className="new-question" key={index}><strong>{item.question}</strong><p>{item.neededEvidence}</p></article>)}</section>}
\n          <section className="new-section new-decision"><h2>{t.decision}</h2><p>{t.decisionHint}</p>{record.decision && <p className="new-saved" role="status">{t.saved} · {new Date(record.decision.updatedAt).toLocaleString(locale)}</p>}<form onSubmit={saveDecision}><fieldset><legend>{locale === "es" ? "Resultado" : "Outcome"}</legend><div className="new-outcomes">{(["approve", "reject", "defer"] as const).map((value) => <label key={value}><input type="radio" name="outcome" value={value} checked={outcome === value} onChange={() => setOutcome(value)} /><span>{t[value]}</span></label>)}</div></fieldset><label htmlFor="decision-rationale">{t.rationale}</label><textarea id="decision-rationale" rows={4} maxLength={4000} required value={rationale} onChange={(event) => setRationale(event.target.value)} /><label htmlFor="decision-conditions">{t.conditions}</label><input id="decision-conditions" maxLength={2000} value={conditions} onChange={(event) => setConditions(event.target.value)} /><button className="new-primary" type="submit" disabled={busy || !outcome || !rationale.trim() || record.stage !== "complete"}>{record.decision ? t.correctDecision : t.saveDecision}</button></form></section>
\n        </>}
\n      </main>
\n    </div>
\n    {selected && <dialog ref={dialog} className="new-dialog" onClose={() => { setSelected(null); trigger.current?.focus(); }}><div className="new-dialog-head"><span>{t.original}</span><button type="button" onClick={closePassage} aria-label={t.close}>{t.close}</button></div><h2>{currentSource?.title}</h2><p>{selected.locator} · {selected.id}</p><blockquote>{selected.text}</blockquote></dialog>}
\n  </div>;
\n}
\n
