# Spec Delta

## Purpose

Enable a local user to investigate a public GitHub repository through bounded read-only operations and verify every source-backed conclusion against a specific commit.

## ADDED Requirements

### Requirement: Public repository intake
The system SHALL accept only a public GitHub repository URL identifying one owner and repository, resolve its current default-branch commit, and reject unsupported or inaccessible targets without making arbitrary network requests.

#### Scenario: Valid public repository
- **WHEN** the user submits a supported public GitHub repository URL
- **THEN** the system displays the canonical owner, repository, and resolved commit before presenting an investigation answer

#### Scenario: Unsupported target
- **WHEN** the user submits a private repository, arbitrary URL, malformed repository URL, or inaccessible repository
- **THEN** the system rejects it with an understandable reason and does not treat the target as investigated

### Requirement: Bounded read-only investigation
The system SHALL expose only validated repository tree, text-search, and file-read operations, with documented limits on tool calls, returned entries, file sizes, and total retrieved content. It SHALL never execute repository code or write to the source repository.

#### Scenario: Supported question
- **WHEN** the user asks a question about an accepted repository
- **THEN** the investigation uses only the allowed read operations at the resolved commit and records their ordered outcomes

#### Scenario: Invalid or excessive operation
- **WHEN** a proposed operation has an unknown name, invalid arguments, disallowed path, or exceeds a limit
- **THEN** the operation is rejected before execution and the run stops with a visible reason

### Requirement: Verifiable answer
The system SHALL attach immutable commit, file path, and line-range links to source-backed claims. It SHALL display an explicit insufficient-evidence result when the inspected source does not support an answer.

#### Scenario: Supported claim
- **WHEN** an answer relies on text successfully read during the current run or an earlier run at the same verified commit
- **THEN** its citation opens that exact repository file and line range at that commit

#### Scenario: Missing evidence
- **WHEN** the allowed investigation cannot find enough supporting source
- **THEN** the result says evidence is insufficient and contains no invented file citation

### Requirement: Inspectable outcome
The system SHALL show a compact ordered trace of tool decisions and stop reasons without exposing credentials, full prompts, or complete file bodies in the trace.

#### Scenario: Completed or stopped run
- **WHEN** an investigation ends, including after a tool error or limit
- **THEN** the user can inspect its tool names, validation and execution outcomes, commit, and terminal reason

### Requirement: Bilingual interaction
The application SHALL start in Spanish, offer an accessible English choice, persist the selected language locally, and pass that language to each answer-generation request while preserving direct source quotations in their original language.

#### Scenario: Language selection
- **WHEN** the user selects English and reloads the application
- **THEN** the interface remains in English and subsequent answer-generation requests receive English as the selected language

### Requirement: Groq-backed live answers
The system SHALL use the configured Groq OpenAI-compatible chat-completions endpoint with strict JSON schemas for open-ended live repository answers, keep credentials server-side, and validate returned citations against inspected evidence.

#### Scenario: Configured live answer provider
- **WHEN** `GROQ_API_KEY` is configured and the user asks about a public repository
- **THEN** the system sends the selected locale and bounded investigation context to Groq, then accepts only source citations verified by the investigation

#### Scenario: Missing live answer provider
- **WHEN** `GROQ_API_KEY` is not configured and the user asks about a live repository
- **THEN** the system explains how to configure Groq while keeping the keyless fixture available
