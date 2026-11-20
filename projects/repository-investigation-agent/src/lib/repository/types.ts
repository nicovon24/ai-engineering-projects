export type Locale = 'es' | 'en';
export type StopCode = 'invalid_repository' | 'inaccessible' | 'private' | 'rate_limited' | 'invalid_tool' | 'invalid_arguments' | 'limit' | 'source_error' | 'provider_error' | 'provider_not_configured' | 'provider_authentication' | 'provider_rate_limited' | 'provider_invalid_request' | 'insufficient_evidence';

export interface Repository { owner: string; repo: string; key: string; sha: string; url: string }
export interface Evidence { id: string; path: string; startLine: number; endLine: number; excerpt: string; sha: string; url: string; originConversationId?: string }
export interface PriorFinding { conversationId: string; runId: string; sha: string; question: string; answer: string; evidence: Evidence[]; inspectedPaths?: { path: string; outcome: string; detail?: string }[] }
export interface TraceEntry { step: number; tool: string; status: 'ok' | 'rejected' | 'error' | 'stop'; detail: string; sha: string; path?: string; count?: number }
export interface InvestigationResult { status: 'answered' | 'insufficient_evidence' | 'stopped'; answer: string; repository: Repository; citations: Evidence[]; evidence: Evidence[]; trace: TraceEntry[]; mode: 'fixture' | 'provider'; changed: boolean; error?: StopCode | string }
export interface InvestigationInput { repositoryUrl: string; question: string; locale: Locale; prior?: PriorFinding[]; adapter?: SourceAdapter; planner?: Planner }
export interface TreeEntry { path: string; type: 'blob' | 'tree'; size?: number }
export interface SourceAdapter {
  resolve(owner: string, repo: string): Promise<string>;
  tree(owner: string, repo: string, sha: string): Promise<TreeEntry[]>;
  file(owner: string, repo: string, sha: string, path: string): Promise<string>;
  mode?: 'fixture' | 'provider';
}
export type ToolCall = { name: 'list_tree'; args: { prefix?: string } } | { name: 'search_text'; args: { query: string; prefix?: string } } | { name: 'read_file'; args: { path: string } };
export interface ToolOutcome { name: string; summary: string; paths?: string[]; evidence?: Evidence[]; partial?: boolean; scanned?: number; total?: number }
export interface PlannerContext { repository: Repository; question: string; locale: Locale; prior: PriorFinding[]; outcomes: ToolOutcome[]; evidence: Evidence[]; remainingCalls: number }
export interface PlannedAnswer { status: 'answered' | 'insufficient_evidence'; answer: string; citationIds: string[] }
export interface Planner { next(context: PlannerContext): Promise<ToolCall | { name: 'finish' }>; answer(context: PlannerContext): Promise<PlannedAnswer> }

export class InvestigationError extends Error {
  constructor(public readonly code: StopCode, message: string) { super(message); this.name = 'InvestigationError'; }
}
