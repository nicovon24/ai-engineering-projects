# Planned review design

Status: Local MVP architecture agreed on 2026-11-02. Modules are being integrated and verified; the canonical tracker owns completion status.

## Routes and local persistence

`/` is the main chat surface, with explicit external-processing consent, source intake, and an editable summary. `/?draft=<id>` reopens a draft. `/reviews` lists and deletes locally saved reviews. `/reviews/<id>` owns stage progress, evidence inspection, synthesis, and the human decision. `/example` preserves the explicitly fictional hand-authored fixture.

The browser advances one server-owned stage per request. An atomic JSON record stores stage outputs; a failed call leaves the last committed stage intact. A per-review process queue serializes mutations. This is a single-process, local-only design, with no cross-instance locking or user accounts. The decision references the evidence snapshot ID and is corrected only through an explicit human action.

Intake accepts five sources per review, 5 MB per file, 40,000 extracted characters per source, and 80,000 total extracted characters. It retains extracted text and source metadata, not original file bytes. PDF pages and text chunks carry locators. A scanned PDF with no usable text requires OCR outside this milestone.

Model context is bounded separately from retained source text. The evidence step uses a deduplicated candidate excerpt pool and validates citations against the exact candidates supplied for each claim. Truncated excerpts do not establish support for unseen text. Larger-corpus retrieval and semantic support require further evaluation.

Architecture figures live in [system-design](../../../system-design/README.md). The [orchestration plan](orchestration.md) records delegated module boundaries and requested versus confirmed model identities.

## Source and stage flow

| Stage | Input | Output | Code-owned check |
| --- | --- | --- | --- |
| Intake | One proposal and its permitted source set | Review ID, options, scope, source passages | Validate size, source ownership, and passage locators. |
| Initial claim extraction | Proposal text | Atomic proposal claims and assumptions | Validate schema, IDs, origins, and maximum count. |
| Perspectives | Same proposal, scope, and source set for both passes | Bounded supporting and opposing arguments | Enforce pass limits and separate argument IDs from source IDs. |
| Claim normalization | Proposal claims and both perspective outputs | Deduplicated atomic ledger with all origins and argument links | Require every factual argument claim to enter the ledger before retrieval. |
| Retrieval | Each factual claim plus current review's passages | Candidate passages and missing-evidence outcome | Restrict candidates to the current review; keep passage provenance. |
| Evidence review | Claim and candidates | Provisional factual verdict, rationale, cited passage IDs | Validate cited IDs; later evaluate semantic support against human labels. |
| Synthesis | Ledger, perspectives, evidence limits | Concise comparison and open questions | Do not promote rhetoric or a model judge score into factual proof. |
| Human decision | Reviewer's selected outcome and rationale | Recorded approve, reject, or defer decision | Require an explicit human action; preserve the evidence snapshot used. |

The server should own the stage sequence and typed outputs. A model may generate perspective text and provisional verdict rationales, but code enforces schema, source scope, quotas, and state transitions. Start with one bounded workflow rather than multiple autonomous agents. Durable jobs are a later response to measured latency or reliability needs.

## Proposed data contract

| Record | Essential fields | Invariant |
| --- | --- | --- |
| `Review` | `id`, `locale`, `proposalId`, `sourceIds`, `stage`, timestamps | Every child record belongs to exactly one review. |
| `Source` | `id`, `reviewId`, `title`, `origin`, `permission`, `documentPath` | The source manifest resolves the display name and authorized document for each passage; `documentPath` is server-owned, never a client-supplied filesystem path. |
| `SourcePassage` | `id`, `sourceId`, `locator`, `text`, `language`, permission note | The passage ID resolves to an inspectable source excerpt. |
| `Argument` | `id`, `perspective`, `text`, `claimIds` | `perspective` is supporting or opposing; argument strength is not factual support. |
| `Claim` | `id`, `text`, `origins`, `kind`, `argumentIds` | One factual assertion per claim; value judgments do not receive a factual verdict. |
| `EvidenceVerdict` | `claimId`, `status`, `supportingPassageIds`, `contradictingPassageIds`, `rationale` | All passage IDs belong to the review; `insufficient` may cite no passage. |
| `OpenQuestion` | `id`, `question`, `reason`, `neededEvidence` | Missing information stays visible in the final review. |
| `HumanDecision` | `outcome`, `rationale`, `conditions`, `evidenceSnapshotId`, timestamp | Created only by the reviewer; no model stage can set `outcome`. |

These are design fields, not a committed database schema. The first local implementation can persist a small review snapshot without selecting production storage. Generated text and source quotations must remain distinguishable. The review state is execution state, not curated memory.

## Hand-authored example checks

These are illustrative labels for the [fictional fixture](../../examples/support-draft-pilot/proposal.md), not model results or measured evaluation scores. The first row restates the source. The remaining rows are deliberately overstated or false test claims that a generated argument might introduce; they are **not** claims made by the proposal. They test whether the ledger can resist persuasive overstatement.

| Claim | Expected evidence interpretation |
| --- | --- |
| “Twenty-four of 40 sampled requests fit the pilot categories.” | `supported` by `PILOT-01:P1`. |
| “The pilot will reduce future handling time by 25%.” | `insufficient`: `PILOT-01:P2` describes a small synthetic exercise, not a future outcome. |
| “No incorrect draft can reach an employee.” | `insufficient`: `RISK-01:P1` records two caught errors but does not establish a zero-error rate. |
| “The provider estimate includes reviewer and control costs.” | `contradicted` by `COST-01:P1`. |
| “Total cost per eligible request is known.” | `insufficient` because `COST-01:P2` lacks workload and reviewer-cost inputs. |

## Planned screen

The [design system](../../../DESIGN.md) gives this project a sibling identity to Document Intelligence. A left rail lists stages and sources. The central 720–800 px reading area starts with the proposal, then shows perspectives, the claim ledger, open questions, and the human decision form. A source inspector is absent until a citation opens it; it displays document, locator, and original passage, and returns focus on close. At mobile width, stages and sources become dedicated panels. The decision is visually separate from the model-generated synthesis.

States must include loading, incomplete source set, insufficient evidence, contradictory evidence, provider failure, and a saved human decision. Citation labels are compact and stable within a review. Verdicts have short text labels and expandable rationale. An English UI may label an older Spanish-generated review rather than silently translate its claims.

## Evaluation and implementation handoff

The fixture view and a basic citation-resolution validator now exist. Next, complete typed stage contracts and review-scoped source isolation, then add bounded generation and retrieval behind replaceable interfaces and durable human decisions. Label cases for semantic claim support and missing counterarguments separately; a correct source ID or persuasive sentence does not prove either. Spanish/English and desktop/mobile browser checks have been run for the local prototype.
