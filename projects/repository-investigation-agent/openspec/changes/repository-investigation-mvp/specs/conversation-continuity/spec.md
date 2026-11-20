# Spec Delta

## Purpose

Preserve a user's repository questions, answers, and inspected evidence across local sessions while preventing findings from an older commit from silently appearing current.

## ADDED Requirements

### Requirement: Durable local conversations
The system SHALL save ordered user and assistant messages, cited sources, inspected paths and outcomes, and investigation traces on the local device so they remain available after the application restarts.

#### Scenario: Resume after restart
- **WHEN** the user restarts the application and opens a previously investigated repository
- **THEN** the earlier conversations and their original question-answer order are available

### Requirement: Cross-conversation recall
The system SHALL let the user search prior conversation messages for the same canonical repository and use relevant earlier investigation records as context for a new question, with their originating conversation and commit visible.

#### Scenario: Search earlier work
- **WHEN** the user searches for a phrase discussed in another conversation about the same repository
- **THEN** matching prior user or assistant messages are shown with a route to their conversation and commit

#### Scenario: Recall inspected source
- **WHEN** the user opens an earlier conversation about the same repository
- **THEN** the paths inspected, their read outcomes, and the commit used by that investigation remain visible

#### Scenario: New related question
- **WHEN** the user asks a question related to an earlier investigation of the same repository
- **THEN** the agent can refer to that investigation, identify its origin, and verify its commit before treating its findings as current evidence

### Requirement: Commit-aware freshness
The system SHALL resolve the repository's current default-branch commit before every new question. If it differs from the commit of a relevant saved investigation, the system SHALL recheck relevant current source before using those findings in a current answer, while preserving old answers and their original citations as historical records.

#### Scenario: Repository unchanged
- **WHEN** the current commit matches a relevant saved investigation's commit
- **THEN** its verified evidence can be reused with attribution to the earlier investigation

#### Scenario: Repository changed
- **WHEN** the current commit differs from a relevant saved investigation's commit
- **THEN** the new answer uses newly verified source at the current commit, indicates that the repository changed, saves the updated finding, and leaves the old answer and citation unchanged even if the relevant source changed or disappeared

#### Scenario: Refresh unavailable
- **WHEN** the repository commit cannot be checked or current source cannot be read
- **THEN** the system labels previous findings as historical, explains the refresh failure, and does not claim a current verified answer

### Requirement: User-controlled local history
The system SHALL let the local user inspect and delete a saved conversation together with its associated investigation records, without changing other conversations about the repository.

#### Scenario: Delete one conversation
- **WHEN** the user deletes a saved conversation
- **THEN** its questions, answers, and investigation records disappear from local history and cross-conversation search while other conversations remain

#### Scenario: Preserve independent citation
- **WHEN** the user deletes a conversation whose evidence was reused in another conversation at the same commit
- **THEN** the other conversation and its validated citation remain available
