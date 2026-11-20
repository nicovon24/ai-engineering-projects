# Spec Delta

## Purpose

Source intake makes every research input explicit, bounded, and inspectable so a report can distinguish retrieved text from unavailable or rejected sources.

## ADDED Requirements

### Requirement: Automatic bounded source discovery
The system SHALL accept a research question and automatically search the public web with one bounded query for at most five distinct public HTTPS source URLs. Search snippets SHALL NOT count as evidence.

#### Scenario: Search results
- **WHEN** the user submits a question and search returns public HTTPS results
- **THEN** the system selects at most five distinct URLs and records their search provenance

#### Scenario: Unsafe or duplicate result
- **WHEN** search returns a private address, malformed URL, or duplicate URL
- **THEN** the system skips that result without fetching it

#### Scenario: Search unavailable
- **WHEN** the search key is absent or the provider fails
- **THEN** the live run stops with a clear configuration or search error

### Requirement: Bounded source snapshots
The system SHALL retrieve only text or HTML sources within documented size and time limits and SHALL record the final URL, retrieval time, title when available, and bounded extracted text for each successful source.

#### Scenario: Successful retrieval
- **WHEN** a discovered source returns supported content within the limits
- **THEN** the run retains a bounded snapshot with its source URL and extracted text

#### Scenario: Unavailable source
- **WHEN** a source times out, redirects to a disallowed destination, or exceeds a limit
- **THEN** the run records a source-specific failure and does not treat it as evidence

### Requirement: Source text is data
The system SHALL treat retrieved text as untrusted evidence and SHALL never execute source code or let source text change the set of allowed operations.

#### Scenario: Instruction-like source text
- **WHEN** retrieved content includes instructions to the research assistant
- **THEN** the system keeps the content as source data and retains the same bounded operations
