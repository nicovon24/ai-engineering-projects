'use client';

import { useEffect, useState, type FormEvent } from 'react';
import type { InvestigationResult } from '@/lib/repository/types';

type Locale = 'es' | 'en';
type Message = { id: string; role: 'user' | 'assistant'; text: string; sha?: string | null; createdAt: string; result?: InvestigationResult };
type Conversation = { id: string; repoKey: string; title: string; messages: Message[] };
type Summary = { id: string; repoKey: string; title: string; updatedAt?: string; latestSha?: string | null };
type SearchHit = { conversationId: string; messageId: string; role: string; text: string; sha?: string | null; title: string };
type HistoricalFinding = { conversationId: string; question: string; answer: string; sha: string };
const DEMO_URL = 'https://github.com/fixture/repository-investigation-demo';

const copy = {
  es: { subtitle: 'Investigación con fuentes, en cada commit.', local: 'Espacio local', history: 'Conversaciones', newer: 'Nueva conversación', search: 'Buscar en este repositorio', noHistory: 'Todavía no hay conversaciones guardadas.', noHits: 'No se encontraron mensajes.', repo: 'Repositorio de GitHub', repoHelp: 'Solo repositorios públicos. Usá la URL principal de GitHub.', demo: 'Cargar demo sin clave', question: 'Tu pregunta', placeholder: '¿Qué explica el README sobre este repositorio?', ask: 'Investigar', asking: 'Investigando…', title: 'Preguntá al código. Seguí la evidencia.', intro: 'Cada respuesta muestra el commit, los archivos consultados y las líneas que la sostienen. Retomá tu trabajo en otra conversación.', empty: 'Empezá con un repositorio y una pregunta.', select: 'Elegí una conversación o iniciá una investigación.', sources: 'Fuentes verificadas', trace: 'Rastro de investigación', noSources: 'No se adjuntaron citas verificadas.', insufficient: 'Evidencia insuficiente', stopped: 'Investigación detenida', answered: 'Respuesta verificada', changed: 'El repositorio cambió. Se volvió a comprobar la fuente actual.', historical: 'Respuesta histórica', commit: 'Commit', remove: 'Eliminar conversación', confirm: '¿Eliminar esta conversación y sus investigaciones guardadas?', loading: 'Cargando…', retry: 'Reintentá o revisá la conexión local.', ready: 'Demo disponible sin clave', menu: 'Abrir conversaciones', close: 'Cerrar conversaciones', you: 'Vos', language: 'Idioma', skip: 'Saltar al contenido', missing: 'Escribí una pregunta para investigar.' },
  en: { subtitle: 'Source-linked investigation at every commit.', local: 'Local workspace', history: 'Conversations', newer: 'New conversation', search: 'Search this repository', noHistory: 'No saved conversations yet.', noHits: 'No matching messages.', repo: 'GitHub repository', repoHelp: 'Public repositories only. Use the main GitHub URL.', demo: 'Load keyless demo', question: 'Your question', placeholder: 'What does the README explain about this repository?', ask: 'Investigate', asking: 'Investigating…', title: 'Ask the code. Follow the evidence.', intro: 'Every answer shows the commit, inspected files, and supporting lines. Resume your work in another conversation.', empty: 'Start with a repository and a question.', select: 'Choose a conversation or begin an investigation.', sources: 'Verified sources', trace: 'Investigation trace', noSources: 'No verified citations were attached.', insufficient: 'Insufficient evidence', stopped: 'Investigation stopped', answered: 'Verified answer', changed: 'The repository changed. Current source was checked again.', historical: 'Historical answer', commit: 'Commit', remove: 'Delete conversation', confirm: 'Delete this conversation and its saved investigations?', loading: 'Loading…', retry: 'Try again or check the local connection.', ready: 'Keyless demo available', menu: 'Open conversations', close: 'Close conversations', you: 'You', language: 'Language', skip: 'Skip to content', missing: 'Enter a question to investigate.' }
};

function Icon({ name, size = 17 }: { name: 'search' | 'plus' | 'arrow' | 'external' | 'trash' | 'menu' | 'close' | 'branch'; size?: number }) {
  const paths = {
    search: <><circle cx="10.8" cy="10.8" r="6.3" /><path d="m16 16 4.2 4.2" /></>, plus: <path d="M12 5v14M5 12h14" />,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    external: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" /></>,
    trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v6m4-6v6" /></>,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />, close: <path d="M5 5l14 14M19 5 5 19" />,
    branch: <><circle cx="6" cy="6" r="2" /><circle cx="18" cy="7" r="2" /><circle cx="6" cy="18" r="2" /><path d="M6 8v8m2 2h5a5 5 0 0 0 5-5V9" /></>
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
function keyFromUrl(url: string): string | null { const match = /^https:\/\/github\.com\/([\w-]+)\/([\w.-]+)$/.exec(url.trim()); return match ? `${match[1]}/${match[2]}`.toLowerCase() : null; }
async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: 'no-store' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || data.error || `HTTP ${response.status}`) as Error & { historical?: HistoricalFinding[] };
    if (Array.isArray(data.historical)) error.historical = data.historical;
    throw error;
  }
  return data as T;
}

export default function Workspace() {
  const [locale, setLocale] = useState<Locale>('es');
  const [localeReady, setLocaleReady] = useState(false);
  const [url, setUrl] = useState('');
  const [question, setQuestion] = useState('');
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [history, setHistory] = useState<Summary[]>([]);
  const [search, setSearch] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [historical, setHistorical] = useState<HistoricalFinding[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const t = copy[locale];
  const selectedRepoKey = conversation?.repoKey ?? keyFromUrl(url);
  const latestSha = history.find(item => item.repoKey === selectedRepoKey && item.latestSha)?.latestSha
    ?? [...(conversation?.messages ?? [])].reverse().find(message => message.role === 'assistant' && message.sha)?.sha;

  useEffect(() => {
    const saved = localStorage.getItem('ria-locale');
    window.setTimeout(() => {
      if (saved === 'es' || saved === 'en') setLocale(saved);
      setLocaleReady(true);
    }, 0);
    api<{ items: Summary[] }>('/api/conversations').then(data => setHistory(data.items)).catch(() => setError(copy.es.retry)).finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (!localeReady) return;
    document.documentElement.lang = locale;
    localStorage.setItem('ria-locale', locale);
  }, [locale, localeReady]);
  useEffect(() => {
    if (!selectedRepoKey || !search.trim()) return;
    const timer = window.setTimeout(() => { api<{ items: SearchHit[] }>(`/api/search?repoKey=${encodeURIComponent(selectedRepoKey)}&q=${encodeURIComponent(search.trim())}`).then(data => setHits(data.items)).catch(() => setHits([])); }, 260);
    return () => window.clearTimeout(timer);
  }, [selectedRepoKey, search]);

  async function refreshHistory() { const data = await api<{ items: Summary[] }>('/api/conversations'); setHistory(data.items); }
  async function openConversation(id: string) {
    setBusy(true); setError('');
    try { const data = await api<{ conversation: Conversation }>(`/api/conversations/${encodeURIComponent(id)}`); setConversation(data.conversation); setUrl(`https://github.com/${data.conversation.repoKey}`); setSearch(''); setSidebarOpen(false); setHistorical([]); }
    catch (cause) { setError(cause instanceof Error ? cause.message : t.retry); }
    finally { setBusy(false); }
  }
  function newConversation() { setConversation(null); setQuestion(''); setSearch(''); setHits([]); setError(''); setHistorical([]); setSidebarOpen(false); }
  async function removeConversation(id: string) {
    if (!window.confirm(t.confirm)) return;
    setBusy(true); setError('');
    try { await api(`/api/conversations/${encodeURIComponent(id)}`, { method: 'DELETE' }); if (conversation?.id === id) setConversation(null); await refreshHistory(); setHits([]); }
    catch (cause) { setError(cause instanceof Error ? cause.message : t.retry); }
    finally { setBusy(false); }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question.trim()) { setError(t.missing); return; }
    setBusy(true); setError(''); setHistorical([]);
    try {
      const data = await api<{ conversation: Conversation; historical?: HistoricalFinding[] }>('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ repositoryUrl: url.trim(), question: question.trim(), locale, ...(conversation?.id ? { conversationId: conversation.id } : {}) }) });
      setConversation(data.conversation); setHistorical(data.historical ?? []); setQuestion(''); await refreshHistory();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.retry);
      if (cause instanceof Error && 'historical' in cause && Array.isArray(cause.historical)) setHistorical(cause.historical as HistoricalFinding[]);
    }
    finally { setBusy(false); }
  }

  return <div className="shell">
    <a className="skip-link" href="#main">{t.skip}</a>
    <header className="topbar"><div className="identity"><span className="identity-mark" aria-hidden="true"><i /><i /><i /></span><div><strong>Repo Atlas</strong><small>{t.subtitle}</small></div></div><div className="topbar-actions"><span className="local-badge"><i />{t.local}</span><div className="locale-switch" role="group" aria-label={t.language}><button type="button" aria-pressed={locale === 'es'} onClick={() => setLocale('es')}>ES</button><button type="button" aria-pressed={locale === 'en'} onClick={() => setLocale('en')}>EN</button></div><button type="button" className="menu-button icon-button" aria-label={sidebarOpen ? t.close : t.menu} onClick={() => setSidebarOpen(!sidebarOpen)}><Icon name={sidebarOpen ? 'close' : 'menu'} /></button></div></header>
    <div className="workspace-layout">
      {sidebarOpen && <button type="button" className="sidebar-scrim" aria-label={t.close} onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? 'is-open' : ''}`} aria-label={t.history}><div className="sidebar-head"><h2>{t.history}</h2><button type="button" className="icon-button" title={t.newer} aria-label={t.newer} onClick={newConversation}><Icon name="plus" /></button></div><button type="button" className="new-button" onClick={newConversation}><Icon name="plus" size={15} />{t.newer}</button><div className="search-area"><label htmlFor="history-search">{t.search}</label><div className="search-field"><Icon name="search" size={16} /><input id="history-search" value={search} onChange={event => setSearch(event.target.value)} disabled={!selectedRepoKey} placeholder={selectedRepoKey ?? t.repo} /></div></div><div className="sidebar-scroll">
        {search.trim() ? <div className="history-list" aria-live="polite">{hits.length ? hits.map(hit => <button type="button" key={hit.messageId} className="history-item" onClick={() => openConversation(hit.conversationId)}><strong>{hit.title}</strong><span>{hit.text}</span><small>{hit.sha?.slice(0, 7) ?? hit.role}</small></button>) : <p className="sidebar-empty">{t.noHits}</p>}</div> : loading ? <p className="sidebar-empty">{t.loading}</p> : history.length ? <div className="history-list">{history.map(item => <div className={`history-row ${conversation?.id === item.id ? 'active' : ''}`} key={item.id}><button type="button" className="history-item" onClick={() => openConversation(item.id)} aria-current={conversation?.id === item.id ? 'page' : undefined}><strong>{item.title || item.repoKey}</strong><span>{item.repoKey}</span>{item.updatedAt && <small>{new Date(item.updatedAt).toLocaleDateString(locale)}</small>}</button><button type="button" className="delete-button" title={t.remove} aria-label={`${t.remove}: ${item.title}`} onClick={() => removeConversation(item.id)}><Icon name="trash" size={15} /></button></div>)}</div> : <p className="sidebar-empty">{t.noHistory}</p>}
      </div><p className="sidebar-foot">8 {locale === 'es' ? 'operaciones · 2.000 archivos · 100 KiB por archivo' : 'operations · 2,000 entries · 100 KiB per file'}</p></aside>
      <main id="main" className="main-panel"><div className="intro"><div><h1>{t.title}</h1><p>{t.intro}</p></div><div className="commit-art" aria-hidden="true"><i /><i /><i /><i /></div></div><div className="content-column"><section className="repository-form" aria-label={t.repo}><div className="form-head"><div><h2>{t.repo}</h2><p>{t.repoHelp}</p></div><button type="button" className="demo-button" onClick={() => { newConversation(); setUrl(DEMO_URL); if (locale === 'es') setQuestion('¿Qué explica el README sobre este repositorio?'); else setQuestion('What does the README say about this repository?'); }}>{t.demo}<Icon name="arrow" size={15} /></button></div><input className="repo-input" aria-label={t.repo} type="url" inputMode="url" placeholder="https://github.com/owner/repo" value={url} onChange={event => { if (conversation) setConversation(null); setHits([]); setHistorical([]); setUrl(event.target.value); }} required form="question-form" /></section>
      <section className="conversation-section" aria-label={t.history}>{conversation?.messages.length ? <div className="message-list">{conversation.messages.map(message => <article className={`message message-${message.role}`} key={message.id}><div className="message-top"><span>{message.role === 'user' ? t.you : 'Repo Atlas'}</span>{message.sha && <span className="sha"><Icon name="branch" size={13} />{message.sha.slice(0, 7)}</span>}{message.role === 'assistant' && message.sha && latestSha && message.sha !== latestSha && <span className="historical-badge">{t.historical}</span>}</div><p className="message-text">{message.text}</p>{message.result && <ResultDetails result={message.result} locale={locale} />}</article>)}</div> : <div className="empty-conversation"><span className="empty-symbol" aria-hidden="true"><i /><i /><i /></span><h2>{t.empty}</h2><p>{t.select}</p></div>}</section>
      <form id="question-form" className="question-form" onSubmit={submit}><label htmlFor="question">{t.question}</label><textarea id="question" value={question} onChange={event => setQuestion(event.target.value)} placeholder={t.placeholder} rows={3} maxLength={2000} required disabled={busy} /><div className="form-actions"><span>{t.ready}</span><button type="submit" className="primary-button" disabled={busy || !url.trim() || !question.trim()}>{busy ? t.asking : t.ask}<Icon name="arrow" /></button></div>{error && <p className="form-error" role="alert">{error}</p>}{historical.length > 0 && <div className="historical-findings"><strong>{t.historical}</strong>{historical.map((finding) => <button type="button" key={`${finding.conversationId}-${finding.sha}`} onClick={() => openConversation(finding.conversationId)}><span>{finding.question}</span><small>{finding.sha.slice(0, 10)} · {finding.answer}</small></button>)}</div>}</form></div></main>
    </div>
  </div>;
}

function ResultDetails({ result, locale }: { result: InvestigationResult; locale: Locale }) {
  const t = copy[locale];
  const reusedLabel = locale === 'es' ? 'Fuente retomada de otra conversación' : 'Source reused from another conversation';
  const label = result.status === 'answered' ? t.answered : result.status === 'insufficient_evidence' ? t.insufficient : t.stopped;
  return <div className="result-details"><div className="result-meta"><span className={`result-status status-${result.status}`}>{label}</span><span className="commit-label"><Icon name="branch" size={14} />{t.commit} <code>{result.repository.sha.slice(0, 10)}</code></span><span className="mode-label">{result.mode === 'fixture' ? 'Fixture' : 'GitHub'}</span></div>{result.changed && result.status !== 'stopped' && <p className="changed-note">{t.changed}</p>}<div className="sources"><h3>{t.sources}</h3>{result.citations.length ? <ul>{result.citations.map(item => <li key={item.id}><a href={item.url} target="_blank" rel="noopener noreferrer"><span className="source-path">{item.path}<small>:{item.startLine}{item.endLine !== item.startLine ? `–${item.endLine}` : ''}</small></span><Icon name="external" size={15} /></a><blockquote>{item.excerpt}</blockquote>{item.originConversationId && <small>{reusedLabel}</small>}</li>)}</ul> : <p className="empty-sources">{t.noSources}</p>}</div><details className="trace"><summary>{t.trace}<span>{result.trace.length}</span></summary><ol>{result.trace.map((entry, index) => <li key={`${entry.step}-${index}`}><span className="trace-index">{String(entry.step).padStart(2, '0')}</span><div><strong>{entry.tool}</strong><span className={`trace-state trace-${entry.status}`}>{entry.status}</span><p>{entry.detail}</p>{entry.path && <code>{entry.path}</code>}</div></li>)}</ol></details></div>;
}
