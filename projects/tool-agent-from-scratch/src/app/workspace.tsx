"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { AgentRun, Locale, PublicNote, RunStatus, TraceEntry } from "../lib/contracts";

type Theme = "light" | "dark";

const copy = {
  es: {
    skip: "Ir al contenido",
    app: "Tool Agent from Scratch",
    demo: "Demostración local · planificador determinista",
    theme: "Cambiar tema",
    light: "Tema claro",
    dark: "Tema oscuro",
    language: "Idioma",
    introduction: "Un agente, paso a paso.",
    description: "Hacé una pregunta sobre las notas ficticias de Faro. Mirá qué herramienta usa, qué fuente lee y por qué termina.",
    notes: "Notas disponibles",
    notesHelp: "Dos fuentes ficticias incluidas en esta aplicación.",
    notesLoading: "Cargando notas…",
    notesError: "No se pudieron cargar las notas.",
    retry: "Reintentar",
    openNote: "Abrir nota",
    source: "Fuente original",
    sourceEmpty: "Elegí una nota o una cita para leer su contenido original.",
    sourceUnavailable: "La nota citada no está disponible. Recargá las fuentes.",
    question: "Tu pregunta",
    questionHint: "Probá con una de estas preguntas",
    placeholder: "Escribí una pregunta sobre el proyecto Faro…",
    exampleDelivery: "¿Cuándo se entrega el proyecto Faro?",
    exampleScope: "¿Qué incluye la primera versión de Faro?",
    send: "Ejecutar agente",
    sending: "Ejecutando…",
    inputHelp: "Una pregunta por ejecución · máximo de cuatro decisiones",
    answer: "Respuesta",
    answerEmpty: "La respuesta y sus citas aparecerán acá después de ejecutar una pregunta.",
    working: "El agente está consultando las notas incluidas…",
    citations: "Notas citadas",
    trace: "Traza de ejecución",
    traceHelp: "Decisiones y resultados en el orden en que ocurrieron.",
    traceEmpty: "Ejecutá una pregunta para ver las decisiones del agente.",
    decision: "Decisión",
    final: "Respuesta final",
    stop: "Motivo de cierre",
    networkError: "No se pudo completar la solicitud. Revisá que el servidor local esté activo e intentá de nuevo.",
    badResponse: "El servidor devolvió una respuesta inesperada. Intentá de nuevo.",
    completed: "Completado",
    started: "Inicio",
    rejected: "Solicitud rechazada",
    tool_error: "Error de herramienta",
    step_limit: "Límite de decisiones",
    planning: "Planificación",
    validating: "Validación",
    executing: "Ejecución",
    stopped: "Detenido",
    noAnswer: "Esta ejecución terminó sin una respuesta fundada en las notas.",
  },
  en: {
    skip: "Skip to content",
    app: "Tool Agent from Scratch",
    demo: "Local demo · deterministic planner",
    theme: "Change theme",
    light: "Light theme",
    dark: "Dark theme",
    language: "Language",
    introduction: "An agent, step by step.",
    description: "Ask about the fictional Faro notes. See which tool it uses, which source it reads, and why it stops.",
    notes: "Available notes",
    notesHelp: "Two fictional sources bundled with this application.",
    notesLoading: "Loading notes…",
    notesError: "The notes could not be loaded.",
    retry: "Retry",
    openNote: "Open note",
    source: "Original source",
    sourceEmpty: "Choose a note or citation to read its original content.",
    sourceUnavailable: "The cited note is unavailable. Reload the sources.",
    question: "Your question",
    questionHint: "Try one of these questions",
    placeholder: "Ask a question about project Faro…",
    exampleDelivery: "When is project Faro due?",
    exampleScope: "What does the first version of Faro include?",
    send: "Run agent",
    sending: "Running…",
    inputHelp: "One question per run · maximum of four decisions",
    answer: "Answer",
    answerEmpty: "The answer and its citations will appear here after you run a question.",
    working: "The agent is consulting the bundled notes…",
    citations: "Cited notes",
    trace: "Execution trace",
    traceHelp: "Decisions and outcomes in the order they occurred.",
    traceEmpty: "Run a question to see the agent's decisions.",
    decision: "Decision",
    final: "Final answer",
    stop: "Stop reason",
    networkError: "The request could not be completed. Check that the local server is running and try again.",
    badResponse: "The server returned an unexpected response. Try again.",
    completed: "Completed",
    started: "Started",
    rejected: "Request rejected",
    tool_error: "Tool error",
    step_limit: "Decision limit",
    planning: "Planning",
    validating: "Validation",
    executing: "Execution",
    stopped: "Stopped",
    noAnswer: "This run ended without an answer supported by the notes.",
  },
} as const;

const outcomes: Record<string, { es: string; en: string }> = {
  started: { es: "Ejecución iniciada", en: "Run started" },
  decision_requested: { es: "Se solicitó una decisión", en: "Decision requested" },
  answer_checked: { es: "Respuesta y fuentes validadas", en: "Answer and sources validated" },
  answer_returned: { es: "Respuesta entregada", en: "Answer returned" },
  call_checked: { es: "Llamada validada", en: "Call validated" },
  call_started: { es: "Llamada a herramienta iniciada", en: "Tool call started" },
  note_read: { es: "Nota leída", en: "Note read" },
  decision_limit_reached: { es: "Se alcanzó el límite de cuatro decisiones", en: "Four-decision limit reached" },
  invalid_request: { es: "Solicitud inválida", en: "Invalid request" },
  invalid_answer: { es: "Respuesta o fuentes inválidas", en: "Invalid answer or sources" },
  invalid_decision: { es: "Decisión inválida", en: "Invalid decision" },
  invalid_arguments: { es: "Argumentos inválidos", en: "Invalid arguments" },
  unknown_tool: { es: "Herramienta desconocida", en: "Unknown tool" },
  note_not_allowed: { es: "Nota fuera de la lista permitida", en: "Note is not allowlisted" },
  planner_error: { es: "Error del planificador", en: "Planner error" },
  tool_error: { es: "Error de herramienta", en: "Tool error" },
  step_limit: { es: "Límite de decisiones alcanzado", en: "Decision limit reached" },
};

function outcomeLabel(outcome: string, locale: Locale): string {
  const hitCount = /^returned_(\d+)_hits$/.exec(outcome);
  if (hitCount) return locale === "es" ? `Búsqueda: ${hitCount[1]} resultados` : `Search: ${hitCount[1]} hits`;
  return outcomes[outcome]?.[locale] ?? outcome.replaceAll("_", " ");
}

function errorLabel(code: string, locale: Locale): string {
  return outcomeLabel(code.toLowerCase(), locale);
}

function isPublicNote(value: unknown): value is PublicNote {
  if (typeof value !== "object" || value === null) return false;
  const note = value as Partial<PublicNote>;
  return typeof note.id === "string" && typeof note.title === "string" && typeof note.content === "string";
}

function isAgentRun(value: unknown): value is AgentRun {
  if (typeof value !== "object" || value === null) return false;
  const run = value as Partial<AgentRun>;
  const statuses: RunStatus[] = ["completed", "rejected", "tool_error", "step_limit"];
  return statuses.includes(run.status as RunStatus) && Array.isArray(run.noteIds) &&
    run.noteIds.every((id) => typeof id === "string") && Array.isArray(run.trace) &&
    run.trace.every((entry: TraceEntry) => typeof entry?.decision === "number" && typeof entry.outcome === "string" && typeof entry.phase === "string");
}

export function Workspace() {
  const [locale, setLocale] = useState<Locale>("es");
  const [theme, setTheme] = useState<Theme>("light");
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [question, setQuestion] = useState("");
  const [notes, setNotes] = useState<PublicNote[]>([]);
  const [notesState, setNotesState] = useState<"loading" | "ready" | "error">("loading");
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [run, setRun] = useState<AgentRun | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const questionRef = useRef<HTMLTextAreaElement>(null);
  const answerRef = useRef<HTMLElement>(null);
  const sourceRef = useRef<HTMLDivElement>(null);
  const t = copy[locale];

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const savedLocale = window.localStorage.getItem("tool-agent-locale");
        const savedTheme = window.localStorage.getItem("tool-agent-theme");
        if (savedLocale === "es" || savedLocale === "en") setLocale(savedLocale);
        if (savedTheme === "light" || savedTheme === "dark") setTheme(savedTheme);
      } catch { /* Browser storage may be unavailable. */ }
      setPreferencesLoaded(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    if (!preferencesLoaded) return;
    try { window.localStorage.setItem("tool-agent-locale", locale); } catch { /* Preference remains in memory. */ }
  }, [locale, preferencesLoaded]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    if (!preferencesLoaded) return;
    try { window.localStorage.setItem("tool-agent-theme", theme); } catch { /* Preference remains in memory. */ }
  }, [theme, preferencesLoaded]);

  async function loadNotes() {
    try {
      const response = await fetch("/api/notes", { cache: "no-store" });
      if (!response.ok) throw new Error("notes request failed");
      const data: unknown = await response.json();
      if (!Array.isArray(data) || !data.every(isPublicNote)) throw new Error("invalid notes response");
      setNotes(data);
      setNotesState("ready");
    } catch {
      setNotesState("error");
    }
  }

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => { void loadNotes(); });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function selectExample(example: string) {
    setQuestion(example);
    questionRef.current?.focus();
  }

  function openCitation(id: string) {
    setSelectedNoteId(id);
    window.requestAnimationFrame(() => sourceRef.current?.focus());
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const request = question.trim();
    if (!request || busy) return;
    setBusy(true);
    setRun(null);
    setRunError(null);
    setSelectedNoteId(null);
    try {
      const response = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request, locale }),
      });
      const data: unknown = await response.json();
      if (!isAgentRun(data)) throw new Error("invalid run response");
      setRun(data);
      if (response.ok && data.noteIds.length > 0) setSelectedNoteId(data.noteIds[0]);
    } catch (error) {
      setRunError(error instanceof Error && error.message === "invalid run response" ? t.badResponse : t.networkError);
    } finally {
      setBusy(false);
      window.requestAnimationFrame(() => answerRef.current?.focus());
    }
  }

  const selectedNote = notes.find((note) => note.id === selectedNoteId);
  const citedNotes = run?.noteIds.map((id) => notes.find((note) => note.id === id)).filter(isPublicNote) ?? [];
  const unavailableCitation = Boolean(run?.noteIds.some((id) => !notes.some((note) => note.id === id)));
  const terminalTrace = run?.trace.filter((entry) => entry.phase === "stopped" || entry.phase === "completed").at(-1);

  return (
    <>
      <a className="skip-link" href="#workspace-main">{t.skip}</a>
      <div className="app-shell">
        <header className="site-header">
          <div className="brand"><span className="brand-mark" aria-hidden="true"><span /><span /><span /></span><span>{t.app}</span></div>
          <div className="header-controls">
            <span className="demo-badge"><span aria-hidden="true" />{t.demo}</span>
            <div className="language-control" role="group" aria-label={t.language}>
              <button type="button" lang="es" aria-pressed={locale === "es"} onClick={() => setLocale("es")}>ES</button>
              <button type="button" lang="en" aria-pressed={locale === "en"} onClick={() => setLocale("en")}>EN</button>
            </div>
            <button className="theme-button" type="button" onClick={() => setTheme(theme === "light" ? "dark" : "light")} aria-label={`${t.theme}: ${theme === "light" ? t.dark : t.light}`} title={`${t.theme}: ${theme === "light" ? t.dark : t.light}`}>
              {theme === "light" ? <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M20.2 15.7A8.5 8.5 0 0 1 8.3 3.8 8.5 8.5 0 1 0 20.2 15.7Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg> : <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>}
            </button>
          </div>
        </header>

        <div className="intro"><h1>{t.introduction}</h1><p>{t.description}</p></div>

        <div className="workspace-grid" id="workspace-main">
          <main className="main-panel">
            <section className="question-section" aria-labelledby="question-heading">
              <div className="section-title"><h2 id="question-heading">{t.question}</h2><span className="section-index">01</span></div>
              <form onSubmit={submit}>
                <label className="sr-only" htmlFor="question-input">{t.question}</label>
                <textarea id="question-input" ref={questionRef} maxLength={1000} rows={3} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={t.placeholder} disabled={busy} />
                <div className="composer-bottom"><p>{t.inputHelp}</p><button className="primary-button" type="submit" disabled={busy || !question.trim()}>{busy ? t.sending : t.send}</button></div>
              </form>
              <div className="examples"><p>{t.questionHint}</p><div className="example-list"><button type="button" onClick={() => selectExample(t.exampleDelivery)} disabled={busy}>{t.exampleDelivery}</button><button type="button" onClick={() => selectExample(t.exampleScope)} disabled={busy}>{t.exampleScope}</button></div></div>
            </section>

            <section className="answer-section" aria-labelledby="answer-heading" ref={answerRef} tabIndex={-1} aria-live="polite" aria-busy={busy}>
              <div className="section-title"><h2 id="answer-heading">{t.answer}</h2><span className="section-index">02</span></div>
              {busy ? <div className="answer-message working"><span className="working-indicator" aria-hidden="true" />{t.working}</div> : runError ? <p className="feedback error" role="alert">{runError}</p> : run ? (
                <div className="run-result">
                  <span className={`status-label status-${run.status}`}>{t[run.status]}</span>
                  <p className="answer-text">{run.answer || t.noAnswer}</p>
                  {run.error && <p className="feedback error" role="alert">{errorLabel(run.error.code, locale)}</p>}
                  {citedNotes.length > 0 && <div className="citations"><h3>{t.citations}</h3><div>{citedNotes.map((note) => <button type="button" key={note.id} className="citation-button" onClick={() => openCitation(note.id)} aria-controls="source-content">{note.id}</button>)}</div></div>}
                  {unavailableCitation && <p className="feedback error">{t.sourceUnavailable}</p>}
                </div>
              ) : <p className="answer-message empty">{t.answerEmpty}</p>}
            </section>
          </main>

          <aside className="notes-panel" aria-labelledby="notes-heading">
            <div className="panel-heading"><h2 id="notes-heading">{t.notes}</h2><p>{t.notesHelp}</p></div>
            {notesState === "loading" ? <p className="panel-message" role="status">{t.notesLoading}</p> : notesState === "error" ? <div className="panel-message"><p>{t.notesError}</p><button className="text-button" type="button" onClick={() => { setNotesState("loading"); void loadNotes(); }}>{t.retry}</button></div> : <ul className="note-list">{notes.map((note) => <li key={note.id}><button type="button" className={selectedNoteId === note.id ? "note-button selected" : "note-button"} onClick={() => setSelectedNoteId(note.id)} aria-label={`${t.openNote}: ${note.title}`} aria-pressed={selectedNoteId === note.id}><span className="note-title">{note.title}</span><span className="note-id">{note.id}</span></button></li>)}</ul>}
            <div className="source-inspector" id="source-content" ref={sourceRef} role="region" aria-label={t.source} tabIndex={-1}><h3>{t.source}</h3>{selectedNote ? <article><p className="source-id">{selectedNote.id}</p><h4>{selectedNote.title}</h4><p className="source-body">{selectedNote.content}</p></article> : <p className="source-empty">{selectedNoteId ? t.sourceUnavailable : t.sourceEmpty}</p>}</div>
          </aside>

          <aside className="trace-panel" aria-labelledby="trace-heading">
            <div className="panel-heading"><h2 id="trace-heading">{t.trace}</h2><p>{t.traceHelp}</p></div>
            {run ? <><ol className="trace-list">{run.trace.map((entry, index) => <li key={`${entry.decision}-${entry.phase}-${index}`} className="trace-entry"><div className="trace-heading"><span className="trace-count">{String(entry.decision).padStart(2, "0")}</span><span>{t.decision} {entry.decision}</span><span className="trace-phase">{entry.phase === "completed" ? t.completed : t[entry.phase]}</span></div><div className="trace-body">{entry.tool && <code>{entry.tool}</code>}<p>{outcomeLabel(entry.outcome, locale)}</p></div></li>)}</ol><div className="stop-summary"><span>{t.stop}</span><strong>{t[run.status]}</strong>{terminalTrace && <p>{outcomeLabel(terminalTrace.outcome, locale)}</p>}</div></> : <p className="panel-message trace-empty">{busy ? t.working : t.traceEmpty}</p>}
          </aside>
        </div>
      </div>
    </>
  );
}
