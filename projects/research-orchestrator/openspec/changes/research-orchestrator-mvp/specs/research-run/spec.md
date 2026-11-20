# Spec Delta

## Purpose

The research run turns a user question and automatically discovered source snapshots into a traceable draft through a small number of visible stages and explicit stopping conditions.

## ADDED Requirements

### Requirement: Bounded research stages
The system SHALL show the ordered stages plan, collect, synthesize, and review, with an outcome for each reached stage and a reason when the run stops early.

#### Scenario: Complete draft
- **WHEN** discovered sources are usable and synthesis succeeds
- **THEN** the run reaches review with a draft and an ordered stage trace

#### Scenario: Insufficient sources
- **WHEN** no discovered source yields usable evidence
- **THEN** the run stops before synthesis and explains that evidence is insufficient

### Requirement: Source-linked report claims
The system SHALL generate a draft in the selected language with source identifiers attached to factual findings, and SHALL reject unknown identifiers rather than presenting them as verified citations.

#### Scenario: Supported finding
- **WHEN** a generated finding cites an identifier from a successfully collected source
- **THEN** the draft links that finding to the source's recorded URL

#### Scenario: Unsupported citation
- **WHEN** generated output cites an unknown or failed source identifier
- **THEN** the output is rejected and the run records a synthesis failure

### Requirement: Keyless demonstration and configured live provider
The system SHALL offer a labeled deterministic demonstration without a model key and SHALL keep live provider credentials on the server.

#### Scenario: Demo without credentials
- **WHEN** the user selects the demonstration with no provider key configured
- **THEN** the system produces a clearly labeled sample draft through the same review flow

#### Scenario: Live run without credentials
- **WHEN** a live run is requested without a configured provider key
- **THEN** the system explains the missing configuration without exposing a secret
