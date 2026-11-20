# Spec Delta

## Purpose

Report review preserves the distinction between an automated draft and a human-approved report while keeping the source links and decision history available locally.

## ADDED Requirements

### Requirement: Draft remains pending human review
The system SHALL label a generated report as a draft until the user explicitly approves it and SHALL display its source links and stage trace during review.

#### Scenario: New draft
- **WHEN** synthesis creates a report
- **THEN** the report is pending review and is not labeled approved

### Requirement: Explicit review decision
The system SHALL let the user edit the draft and then approve it or return it for revision, storing the decision and edited text without changing the retrieved source snapshots.

#### Scenario: Approval after edit
- **WHEN** the user edits a draft and selects approve
- **THEN** the edited report is saved as approved with a review timestamp

#### Scenario: Return for revision
- **WHEN** the user returns a draft with a note
- **THEN** the report remains unapproved and the note is saved for the next revision

### Requirement: Local history
The system SHALL retain runs, source records, draft content, review decisions, and citations locally across application restarts and SHALL let the user reopen a prior run.

#### Scenario: Reopen after restart
- **WHEN** the application restarts after a report was reviewed
- **THEN** the user can reopen that report with its status, source links, and review decision intact
