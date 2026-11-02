"use client";

import { useRouter } from "next/navigation";
import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { FileText, Sun, Moon, PanelLeft, PanelRight } from "lucide-react";
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
  onSelect,
}: { id: string; label: string; onSelect: (id: string) => void }) {
  return <Button className="citation" variant="outline" size="sm" type="button" onClick={() => onSelect(id)}>{label}</Button>;
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
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
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
    setSelectedPassageId(id);
    sourcePanel.current?.scrollTo({ top: 0 });
    sourceQuote.current?.scrollTo({ top: 0 });
    if (window.matchMedia("(max-width: 1100px)").matches) openMobilePanel("sources");
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

  function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (operation.current || documents.length >= MAX_DOCUMENTS) return;
    if (!selectedFileName) {
      setMessage({ tone: "error", text: t.errors.no_file });
      return;
    }
    const form = event.currentTarget;
    const data = new FormData(form);
    void runAction(() => uploadDocument(data), () => {
      uploadForm.current?.reset();
      setSelectedFileName(null);
      setMessage({ tone: "success", text: t.uploadSuccess });
      router.refresh();
    });
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
    return entry.passage.page ? `${entry.name} · ${t.pageShort} ${entry.passage.page}` : entry.name;
  }

  return (
    <div className="app-shell" data-mobile-panel={mobilePanel ?? "chat"} data-has-questions={questions.length > 0 || pendingQuestion !== null}>
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
        {documents.length === 0 && <Button variant="outline" className="intro-upload" onClick={() => openMobilePanel("documents", true)}>{t.upload}</Button>}
      </div>

      <main className="workspace-grid">
        <aside ref={documentsPanel} tabIndex={-1} className={`documents-panel ${mobilePanel === "documents" ? "mobile-open" : ""}`} aria-labelledby="documents-heading">
          <div className="rail-brand"><span className="brand-mark" aria-hidden="true"><FileText size={19} strokeWidth={1.7} /></span><strong>{t.appName}</strong></div>
          <div className="mobile-panel-head"><Button variant="ghost" size="sm" onClick={closeMobilePanel}>{t.closePanel}</Button></div>
          <div className="section-heading">
            <div><h2 id="documents-heading">{t.documents}</h2><p>{documents.length}/{MAX_DOCUMENTS} {t.fileCount}</p></div>
          </div>
          <form ref={uploadForm} onSubmit={handleUpload} className="upload-form">
            <label htmlFor="file-upload" className="field-label">{t.upload}</label>
            <input id="file-upload" className="file-input-hidden" name="file" type="file" accept=".pdf,.txt,.md,.docx" tabIndex={-1} aria-hidden="true" onChange={(event) => setSelectedFileName(event.currentTarget.files?.[0]?.name ?? null)} disabled={busy || asking || documents.length >= MAX_DOCUMENTS} />
            <Button id="choose-file-button" variant="outline" className="file-picker-button" type="button" aria-describedby="file-selection upload-limits" disabled={busy || asking || documents.length >= MAX_DOCUMENTS} onClick={() => document.getElementById("file-upload")?.click()}>{t.chooseFile}</Button>
            <p id="file-selection" className="selected-file" role="status">{selectedFileName ?? t.noFileSelected}</p>
            <p id="upload-limits" className="help-text">{t.uploadHint}</p>
            <Button variant="default" className="upload-submit" type="submit" disabled={busy || asking || documents.length >= MAX_DOCUMENTS}>{busy ? t.loading : t.uploadSelected}</Button>
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
            <strong>{t.workspace}</strong>
            <p>{t.workspaceHint}</p>
            {documents.length > 0 && <Button variant="destructive" className="delete-button" type="button" disabled={busy || asking} onClick={handleDeleteWorkspace}>{t.deleteWorkspace}</Button>}
          </div>
        </aside>

        <section id="workspace-main" tabIndex={-1} className={`conversation-panel ${questions.length === 0 && pendingQuestion === null ? "is-empty" : ""}`} aria-label={t.questionLabel}>
          <div className="mobile-toolbar"><Button variant="ghost" size="sm" onClick={() => openMobilePanel("documents")}><PanelLeft size={17} />{t.openDocuments}</Button><Button variant="ghost" size="sm" onClick={() => openMobilePanel("sources")}><PanelRight size={17} />{t.openSources}</Button></div>
          <div ref={historyRef} className="history" aria-live="polite">
            {questions.length === 0 && pendingQuestion === null ? (
              <div className="empty-questions"><h2>{t.noQuestions}</h2><p>{t.noQuestionsHint}</p></div>
            ) : questions.map((entry) => <article className="answer-block" key={entry.id}>
              <div className="asked-question"><span className="question-icon" aria-hidden="true">?</span><h2>{entry.question}</h2></div>
              <div className="answer-content">
                {entry.retrievalMode === "lexical_fallback" && <p className="help-text" role="status">{t.semanticUnavailable}</p>}
                {entry.status === "insufficient_evidence" ? <p className="insufficient">{t.insufficient}</p> : null}
                {entry.generalAnswer && <section className="general-answer" aria-label={t.generalAnswer}><h3>{t.generalAnswer}</h3><p>{entry.generalAnswer.text}</p><p className="help-text">{t.generalAnswerHint}</p></section>}
                {entry.status === "answered" && <><h3>{t.answer}</h3><ol className="claim-list">{entry.claims.map((claim, index) => <li key={`${entry.id}-${index}`}><p>{claim.text}</p><div className="citation-list">{claim.passageIds.map((id) => <SourceButton key={id} id={id} label={sourceLabel(id)} onSelect={selectSource} />)}</div></li>)}</ol><p className="verification-note">{t.citationsNote}</p></>}
                {entry.status === "evidence_only" && <><h3>{t.evidenceOnly}</h3><p className="help-text">{t.evidenceOnlyHint}</p><div className="evidence-list">{entry.passageIds.map((id) => { const item = passageMap.get(id); return item ? <div className="evidence-item" key={id}><p>{item.passage.text.slice(0, 240)}{item.passage.text.length > 240 ? "…" : ""}</p><SourceButton id={id} label={sourceLabel(id)} onSelect={selectSource} /></div> : null; })}</div></>}
              </div>
            </article>)}
            {pendingQuestion && <article className="answer-block answer-pending" aria-busy="true"><div className="asked-question"><span className="question-icon" aria-hidden="true">?</span><h2>{pendingQuestion}</h2></div><div className="answer-content" role="status">{t.questionPending}</div></article>}
          </div>
          <div className="status-strip" role="note"><span className="status-dot" aria-hidden="true" /><div><strong>{aiConfigured ? t.aiMode : t.evidenceMode}</strong><p>{aiConfigured ? t.aiModeHint : t.evidenceModeHint}</p></div></div>
          {message && <div className={`feedback feedback-${message.tone}`} role={message.tone === "error" ? "alert" : "status"}>{message.text}</div>}
          <div className="question-area">
            <div className="question-topline"><span>{t.questionLabel}</span><span>{MAX_QUESTIONS - questions.length} {t.questionsLeft}</span></div>
            <form onSubmit={handleQuestion}>
              <label className="sr-only" htmlFor="question-input">{t.questionLabel}</label>
              <Textarea id="question-input" name="question" autoComplete="off" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={t.questionPlaceholder} maxLength={1000} rows={3} disabled={busy || asking || documents.length === 0 || questions.length >= MAX_QUESTIONS} required />
              <div className="question-actions"><p>{documents.length === 0 ? t.errors.no_documents : t.askHint}</p><Button variant="default" type="submit" disabled={busy || asking || documents.length === 0 || questions.length >= MAX_QUESTIONS || question.trim().length < 3}>{asking ? t.loading : aiConfigured ? t.ask : t.search}</Button></div>
            </form>
          </div>
        </section>

        <aside ref={sourcePanel} tabIndex={-1} className={`source-panel ${mobilePanel === "sources" ? "mobile-open" : ""}`} aria-labelledby="source-heading">
          <div className="mobile-panel-head"><Button variant="ghost" size="sm" onClick={closeMobilePanel}>{t.closePanel}</Button></div>
          <h2 id="source-heading">{t.sourcePanel}</h2>
          {selected ? <div className="source-detail"><div className="source-file"><span className="file-type small" aria-hidden="true">{documents.find((item) => item.id === selected.passage.documentId)?.extension.toUpperCase()}</span><strong>{selected.name}</strong></div><p className="source-location">{selected.passage.page ? `${t.page} ${selected.passage.page}` : t.location} · {selected.passage.startOffset}–{selected.passage.endOffset}</p><blockquote ref={sourceQuote} key={selectedPassageId}>{selected.passage.text}</blockquote><a href={`/api/documents/${selected.passage.documentId}`} className="download-link">{t.download}</a></div> : <div className="source-placeholder"><div className="source-lines" aria-hidden="true"><span /><span /><span /><span /></div><p>{t.sourceEmpty}</p></div>}
        </aside>
      </main>
    </div>
  );
}
