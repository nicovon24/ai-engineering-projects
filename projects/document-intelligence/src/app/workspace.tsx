"use client";

import { useRouter } from "next/navigation";
import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { FileText, Sun, Moon, PanelLeft, PanelRight, Send, Upload, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MAX_DOCUMENTS, MAX_QUESTIONS } from "@/lib/limits";
import { getCopy } from "@/lib/i18n";
import type { Locale, Passage, PublicWorkspace, QuestionRecord } from "@/lib/types";
import { deleteDocument, deleteWorkspace, setLocale, uploadDocument } from "./actions";

type Props = {
  locale: Locale;
  workspace: PublicWorkspace | null;
  aiConfigured: boolean;
};

const THEME_EVENT = "document-intelligence-theme-change";

function subscribeTheme(callback: () => void) {
  window.addEventListener(THEME_EVENT, callback);
  return () => window.removeEventListener(THEME_EVENT, callback);
}

function getTheme() {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function getServerTheme() {
  return "dark";
}

function SourceButton({
  id,
  label,
  title,
  onSelect,
}: { id: string; label: string; title?: string; onSelect: (id: string) => void }) {
  return <Button className="citation" variant="outline" size="sm" type="button" title={title} onClick={() => onSelect(id)}>{label}</Button>;
}

function shortSourceName(name: string): string {
  if (/(?:^|[_\s-])cv(?:[_\s.-]|$)/i.test(name)) return "CV";
  const base = name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
  return base.length > 24 ? `${base.slice(0, 21).trimEnd()}…` : base;
}

export function Workspace({ locale, workspace, aiConfigured }: Props) {
  const router = useRouter();
  const [selectedLocale, setSelectedLocale] = useState<Locale | null>(null);
  const activeLocale = selectedLocale ?? locale;
  const t = getCopy(activeLocale);
  const uploadForm = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState(false);
  const operation = useRef(false);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [localRecords, setLocalRecords] = useState<{ record: QuestionRecord; documentIds: string[] }[]>([]);
  const [hiddenDocuments, setHiddenDocuments] = useState<string[]>([]);
  const [clearedDocumentIds, setClearedDocumentIds] = useState<string[] | null>(null);
  const [scrollRequest, setScrollRequest] = useState(0);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [selectedPassageId, setSelectedPassageId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const theme = useSyncExternalStore(subscribeTheme, getTheme, getServerTheme);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<"documents" | "sources" | null>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const documentsPanel = useRef<HTMLElement>(null);
  const sourcePanel = useRef<HTMLElement>(null);
  const sourceQuote = useRef<HTMLQuoteElement>(null);
  const panelReturnFocus = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    let saved: "light" | "dark" = "dark";
    try { saved = localStorage.getItem("di-theme") === "light" ? "light" : "dark"; } catch { /* Storage may be unavailable. */ }
    document.documentElement.dataset.theme = saved;
    document.documentElement.classList.toggle("dark", saved === "dark");
    window.dispatchEvent(new Event(THEME_EVENT));
  }, []);

  function handleTheme() {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    document.documentElement.classList.toggle("dark", next === "dark");
    window.dispatchEvent(new Event(THEME_EVENT));
    try { localStorage.setItem("di-theme", next); } catch { /* Keep the current session theme. */ }
  }

  function openMobilePanel(panel: "documents" | "sources", focusFilePicker = false) {
    panelReturnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setMobilePanel(panel);
    requestAnimationFrame(() => {
      if (focusFilePicker) document.getElementById("choose-file-button")?.focus();
      else if (panel === "documents") documentsPanel.current?.focus();
      else sourcePanel.current?.focus();
    });
  }

  function closeMobilePanel() {
    setMobilePanel(null);
    requestAnimationFrame(() => panelReturnFocus.current?.focus());
  }

  function selectSource(id: string) {
    panelReturnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSelectedPassageId(id);
    sourcePanel.current?.scrollTo({ top: 0 });
    sourceQuote.current?.scrollTo({ top: 0 });
    if (window.matchMedia("(max-width: 1100px)").matches) openMobilePanel("sources");
  }

  function closeSource() {
    setSelectedPassageId(null);
    setMobilePanel(null);
    requestAnimationFrame(() => panelReturnFocus.current?.focus());
  }

  const serverDocuments = workspace?.documents ?? [];
  const serverQuestions = workspace?.questions ?? [];
  const workspaceCleared = clearedDocumentIds !== null && serverDocuments.length > 0 &&
    serverDocuments.every((document) => clearedDocumentIds.includes(document.id));
  const activeHiddenDocuments = hiddenDocuments.filter((id) => serverDocuments.some((document) => document.id === id));
  const documents = workspaceCleared ? [] : serverDocuments.filter((document) => !activeHiddenDocuments.includes(document.id));
  const documentIds = new Set(documents.map((document) => document.id));
  const serverIds = new Set(serverQuestions.map((entry) => entry.id));
  const latestServerTime = Date.parse(serverQuestions.at(-1)?.askedAt ?? "") || 0;
  const documentSet = serverDocuments.map((document) => document.id).sort().join(",");
  const workspaceRevision = `${documentSet}|${serverQuestions.map((entry) => entry.id).join(",")}`;
  const [seenRevision, setSeenRevision] = useState(workspaceRevision);
  if (workspaceRevision !== seenRevision) {
    setSeenRevision(workspaceRevision);
    setLocalRecords((current) => current.filter(({ record, documentIds }) =>
      !serverIds.has(record.id) &&
      documentIds.slice().sort().join(",") === documentSet &&
      (Date.parse(record.askedAt) || 0) >= latestServerTime));
  }
  const visibleLocalRecords = localRecords.filter(({ record, documentIds }) =>
    !serverIds.has(record.id) &&
    documentIds.slice().sort().join(",") === documentSet &&
    (Date.parse(record.askedAt) || 0) >= latestServerTime &&
    documents.length > 0).map(({ record }) => record);
  const questions = workspaceCleared || activeHiddenDocuments.length > 0 ? [] : [...serverQuestions, ...visibleLocalRecords];

  useLayoutEffect(() => {
    const history = historyRef.current;
    if (history) history.scrollTop = history.scrollHeight;
  }, [scrollRequest]);
  useLayoutEffect(() => {
    sourcePanel.current?.scrollTo({ top: 0 });
    sourceQuote.current?.scrollTo({ top: 0 });
  }, [selectedPassageId]);
  const passageMap = new Map<string, { passage: Passage; name: string }>();
  for (const document of documents) {
    for (const passage of document.passages) passageMap.set(passage.id, { passage, name: document.name });
  }
  const selected = selectedPassageId ? passageMap.get(selectedPassageId) : null;

  function errorText(code: string): string {
    return t.errors[code as keyof typeof t.errors] ?? t.errors.unexpected_error;
  }

  async function runAction(action: () => Promise<{ ok: true } | { ok: false; error: string }>, onSuccess: () => void) {
    if (operation.current) return;
    operation.current = true;
    setBusy(true);
    setMessage(null);
    try {
      const result = await action();
      if (!result.ok) setMessage({ tone: "error", text: errorText(result.error) });
      else onSuccess();
    } catch {
      setMessage({ tone: "error", text: t.errors.unexpected_error });
    } finally {
      operation.current = false;
      setBusy(false);
    }
  }

  function uploadFile(file: File) {
    if (operation.current || documents.length >= MAX_DOCUMENTS) return;
    const data = new FormData();
    data.set("file", file);
    setUploading(true);
    void runAction(() => uploadDocument(data), () => {
      uploadForm.current?.reset();
      setMessage({ tone: "success", text: t.uploadSuccess });
      router.refresh();
    }).finally(() => setUploading(false));
  }

  function handleRemove(id: string) {
    if (operation.current || !documentIds.has(id)) return;
    void runAction(() => deleteDocument(id), () => {
      setHiddenDocuments((current) => [...current, id]);
      setLocalRecords([]);
      setSelectedPassageId(null);
      setMessage({ tone: "success", text: t.removeSuccess });
      router.refresh();
    });
  }

  function handleDeleteWorkspace() {
    if (operation.current || documents.length === 0) return;
    if (!window.confirm(t.deleteConfirm)) return;
    void runAction(deleteWorkspace, () => {
      setClearedDocumentIds(documents.map((document) => document.id));
      setLocalRecords([]);
      setSelectedPassageId(null);
      setQuestion("");
      setMessage({ tone: "success", text: t.deleteSuccess });
      router.refresh();
    });
  }

  function handleLocale(next: Locale) {
    if (next === activeLocale || operation.current) return;
    void runAction(() => setLocale(next), () => {
      setSelectedLocale(next);
      router.refresh();
    });
  }

  async function handleQuestion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (operation.current || documents.length === 0 || questions.length >= MAX_QUESTIONS) return;
    const submittedQuestion = question.trim();
    if (submittedQuestion.length < 3) return;
    operation.current = true;
    setMessage(null);
    setAsking(true);
    setPendingQuestion(submittedQuestion);
    setScrollRequest((current) => current + 1);
    try {
      const response = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: submittedQuestion, locale: activeLocale }),
      });
      const payload = await response.json() as { error?: string; record?: QuestionRecord };
      if (!response.ok) {
        setMessage({ tone: "error", text: errorText(payload.error ?? "unexpected_error") });
        return;
      }
      if (!payload.record?.id) throw new Error("Question response did not include a saved record");
      setLocalRecords((current) => [...current, { record: payload.record!, documentIds: serverDocuments.map((document) => document.id) }]);
      setQuestion("");
      setScrollRequest((current) => current + 1);
      router.refresh();
    } catch {
      setMessage({ tone: "error", text: t.errors.unexpected_error });
    } finally {
      setPendingQuestion(null);
      setAsking(false);
      operation.current = false;
    }
  }

  function sourceLabel(id: string): string {
    const entry = passageMap.get(id);
    if (!entry) return t.sources;
    return entry.passage.page ? `${shortSourceName(entry.name)} · ${t.pageShort} ${entry.passage.page}` : shortSourceName(entry.name);
  }

  return (
    <div className="app-shell" data-mobile-panel={mobilePanel ?? "chat"} data-source-open={selected !== null} data-has-questions={questions.length > 0 || pendingQuestion !== null}>
      <a className="skip-link" href="#workspace-main">{t.skipToContent}</a>
      <header className="topbar">
        <div className="brand"><span className="brand-mark" aria-hidden="true"><FileText size={19} strokeWidth={1.7} /></span><span>{t.appName}</span></div>
        <div className="topbar-actions">
          <span className={`mode-badge ${aiConfigured ? "mode-ai" : "mode-local"}`}>{aiConfigured ? t.aiMode : t.evidenceMode}</span>
          <div className="language-switch" role="group" aria-label={activeLocale === "es" ? "Idioma" : "Language"}>
            <Button variant="ghost" size="sm" type="button" lang="es" aria-pressed={activeLocale === "es"} disabled={busy || asking} onClick={() => handleLocale("es")}>ES</Button>
            <Button variant="ghost" size="sm" type="button" lang="en" aria-pressed={activeLocale === "en"} disabled={busy || asking} onClick={() => handleLocale("en")}>EN</Button>
          </div>
          <Button variant="ghost" size="icon" className="theme-button" type="button" aria-label={t.themeToggle} aria-pressed={theme === "dark"} title={t.themeToggle} onClick={handleTheme}><Sun className="theme-sun" size={18} /><Moon className="theme-moon" size={18} /></Button>
        </div>
      </header>

      <div className="intro-band">
        <h1>{documents.length === 0 ? t.uploadFirst : t.headline}</h1>
        <p>{documents.length === 0 ? t.uploadFirstHint : t.intro}</p>
        {documents.length === 0 && <Button variant="outline" className="intro-upload" onClick={() => openMobilePanel("documents", true)}>{t.addDocuments}</Button>}
      </div>

      <main className="workspace-grid">
        <aside ref={documentsPanel} tabIndex={-1} className={`documents-panel ${mobilePanel === "documents" ? "mobile-open" : ""}`} aria-labelledby="documents-heading">
          <div className="rail-brand"><span className="brand-mark" aria-hidden="true"><FileText size={19} strokeWidth={1.7} /></span><strong>{t.appName}</strong></div>
          <div className="mobile-panel-head"><Button variant="ghost" size="sm" onClick={closeMobilePanel}>{t.closePanel}</Button></div>
          <div className="section-heading">
            <div><h2 id="documents-heading">{t.documents}</h2><p>{documents.length}/{MAX_DOCUMENTS} {t.fileCount}</p></div>
          </div>
          <form ref={uploadForm} className={`upload-form ${dragging ? "is-dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }} onDrop={(event) => { event.preventDefault(); setDragging(false); const file = event.dataTransfer.files[0]; if (file) uploadFile(file); }}>
            <input id="file-upload" className="file-input-hidden" name="file" type="file" accept=".pdf,.txt,.md,.docx" tabIndex={-1} aria-hidden="true" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) uploadFile(file); event.currentTarget.value = ""; }} disabled={busy || asking || documents.length >= MAX_DOCUMENTS} />
            <Button id="choose-file-button" variant="outline" className="file-picker-button" type="button" aria-describedby="upload-limits" disabled={busy || asking || documents.length >= MAX_DOCUMENTS} onClick={() => document.getElementById("file-upload")?.click()}><Upload size={17} aria-hidden="true" />{uploading ? t.loading : t.addDocuments}</Button>
            <p id="upload-limits" className="help-text">{t.uploadHint}</p>
            <p className="drop-hint">{t.dropHint}</p>
          </form>

          {documents.length === 0 ? (
            <div className="empty-documents"><div className="empty-symbol" aria-hidden="true"><span /><span /><span /></div><strong>{t.noDocuments}</strong><p>{t.noDocumentsHint}</p></div>
          ) : (
            <ul className="document-list">
              {documents.map((document) => <li key={document.id} className="document-row">
                <div className="file-type" aria-hidden="true">{document.extension.toUpperCase()}</div>
                <div className="document-details"><strong title={document.name}>{document.name}</strong><span>{document.pageCount ? `${document.pageCount} ${t.page.toLowerCase()}${document.pageCount === 1 ? "" : "s"}` : document.extension.toUpperCase()} · {(document.size / 1024 / 1024).toFixed(2)} MB</span></div>
                <Button type="button" variant="ghost" size="sm" className="remove-button" disabled={busy || asking} onClick={() => handleRemove(document.id)} aria-label={`${t.remove}: ${document.name}`}>{t.remove}</Button>
              </li>)}
            </ul>
          )}

          <div className="workspace-meta">
            <details className="workspace-menu"><summary>{t.workspace}<ChevronDown size={15} aria-hidden="true" /></summary><p>{t.workspaceHint}</p>{documents.length > 0 && <Button variant="destructive" className="delete-button" type="button" disabled={busy || asking} onClick={handleDeleteWorkspace}>{t.deleteWorkspace}</Button>}</details>
          </div>
        </aside>

        <section id="workspace-main" tabIndex={-1} className={`conversation-panel ${questions.length === 0 && pendingQuestion === null ? "is-empty" : ""}`} aria-label={t.questionLabel}>
          <div className="mobile-toolbar"><Button variant="ghost" size="sm" onClick={() => openMobilePanel("documents")}><PanelLeft size={17} />{t.openDocuments}</Button>{selected && <Button variant="ghost" size="sm" onClick={() => openMobilePanel("sources")}><PanelRight size={17} />{t.openSources}</Button>}</div>
          <div ref={historyRef} className="history" aria-live="polite">
            {questions.length === 0 && pendingQuestion === null ? (
              <div className="empty-questions"><h2>{t.noQuestions}</h2><p>{t.noQuestionsHint}</p></div>
            ) : questions.map((entry) => {
              const sourceIds = [...new Set(entry.status === "answered" ? entry.claims.flatMap((claim) => claim.passageIds) : entry.passageIds)].filter((id) => passageMap.has(id));
              const sourceNumbers = new Map(sourceIds.map((id, index) => [id, index + 1]));
              const responseStatus = entry.generalAnswer ? t.externalStatus : entry.status === "answered" ? t.withSources : entry.status === "evidence_only" ? t.evidenceOnly : t.noEvidenceStatus;
              return <article className="answer-block" key={entry.id}>
                <div className="asked-question"><h2 lang={entry.locale}>{entry.question}</h2></div>
                <div className="answer-content">
                  <div className="answer-meta"><span className={`answer-status status-${entry.generalAnswer ? "external" : entry.status}`}>{responseStatus}</span>{entry.locale !== activeLocale && <span className="answer-language">{t.answerLanguage}: {entry.locale.toUpperCase()}</span>}</div>
                  {entry.status === "insufficient_evidence" && !entry.generalAnswer && <p className="insufficient">{t.insufficient}</p>}
                  {entry.generalAnswer && <p className="general-text" lang={entry.locale}>{entry.generalAnswer.text}</p>}
                  {entry.status === "answered" && <ol className="claim-list">{entry.claims.map((claim, index) => <li key={`${entry.id}-${index}`}><p lang={entry.locale}>{claim.text}</p><div className="citation-list">{[...new Set(claim.passageIds)].map((id) => sourceNumbers.has(id) && <SourceButton key={id} id={id} label={`[${sourceNumbers.get(id)}]`} title={sourceLabel(id)} onSelect={selectSource} />)}</div></li>)}</ol>}
                  {entry.status === "evidence_only" && <div className="evidence-list">{sourceIds.map((id) => { const item = passageMap.get(id)!; return <div className="evidence-item" key={id}><p>{item.passage.text.slice(0, 240)}{item.passage.text.length > 240 ? "…" : ""}</p><SourceButton id={id} label={`[${sourceNumbers.get(id)}] ${sourceLabel(id)}`} onSelect={selectSource} /></div>; })}</div>}
                  {entry.status === "answered" && <div className="source-ref-list" aria-label={t.sources}>{sourceIds.map((id) => <SourceButton key={id} id={id} label={`[${sourceNumbers.get(id)}] ${sourceLabel(id)}`} onSelect={selectSource} />)}</div>}
                  <details className="answer-details"><summary>{t.responseDetails}</summary><p>{entry.generalAnswer ? t.generalAnswerHint : entry.status === "answered" ? t.citationsNote : entry.status === "evidence_only" ? t.evidenceOnlyHint : t.insufficient}</p>{entry.retrievalMode === "lexical_fallback" && <p>{t.semanticUnavailable}</p>}{entry.generalAnswer && <p>{t.insufficient}</p>}</details>
                </div>
              </article>;
            })}
            {pendingQuestion && <article className="answer-block answer-pending" aria-busy="true"><div className="asked-question"><span className="question-icon" aria-hidden="true">?</span><h2>{pendingQuestion}</h2></div><div className="answer-content" role="status">{t.questionPending}</div></article>}
          </div>
          <details className="status-strip"><summary>{aiConfigured ? t.aiMode : t.evidenceMode}</summary><p>{aiConfigured ? t.aiModeHint : t.evidenceModeHint}</p></details>
          {message && <div className={`feedback feedback-${message.tone}`} role={message.tone === "error" ? "alert" : "status"}>{message.text}</div>}
          <div className="question-area">
            <div className="question-topline"><span>{t.questionLabel}</span><span>{MAX_QUESTIONS - questions.length} {t.questionsLeft}</span></div>
            <form onSubmit={handleQuestion}>
              <label className="sr-only" htmlFor="question-input">{t.questionLabel}</label>
              <Textarea id="question-input" name="question" autoComplete="off" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={t.questionPlaceholder} maxLength={1000} rows={2} disabled={busy || asking || documents.length === 0 || questions.length >= MAX_QUESTIONS} required />
              <div className="question-actions"><Button variant="default" type="submit" aria-label={asking ? t.loading : aiConfigured ? t.ask : t.search} disabled={busy || asking || documents.length === 0 || questions.length >= MAX_QUESTIONS || question.trim().length < 3}><Send size={18} aria-hidden="true" /></Button></div>
            </form>
          </div>
        </section>

        {selected && <aside ref={sourcePanel} tabIndex={-1} className={`source-panel ${mobilePanel === "sources" ? "mobile-open" : ""}`} aria-labelledby="source-heading">
          <div className="source-panel-header"><h2 id="source-heading">{t.sourcePanel}</h2><Button variant="ghost" size="icon" type="button" aria-label={t.closePanel} onClick={closeSource}><X size={18} aria-hidden="true" /></Button></div>
          <div className="source-detail"><div className="source-file"><span className="file-type small" aria-hidden="true">{documents.find((item) => item.id === selected.passage.documentId)?.extension.toUpperCase()}</span><strong>{selected.name}</strong></div><p className="source-location">{selected.passage.page ? `${t.page} ${selected.passage.page}` : t.location} · {selected.passage.startOffset}–{selected.passage.endOffset}</p><blockquote ref={sourceQuote} key={selectedPassageId}>{selected.passage.text}</blockquote><a href={`/api/documents/${selected.passage.documentId}`} className="download-link">{t.download}</a></div>
        </aside>}
      </main>
    </div>
  );
}
