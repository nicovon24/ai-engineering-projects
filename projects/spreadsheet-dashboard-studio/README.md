# Spreadsheet Dashboard Studio

## Problem

People can have useful data in an Excel workbook but lack a quick way to explore it as a trustworthy dashboard. The application should help them inspect columns, choose meaningful metrics and charts, and understand how each displayed value was calculated.

## Target user

A person working on a personal or small-team project who wants to turn a workbook into an editable dashboard. The application is also an AI Engineering learning project whose data processing, chart selection, evaluation, and product decisions can be explained in interviews.

## Intended demo

A user uploads an `.xlsx` workbook, chooses a sheet, reviews detected columns and data types, accepts or edits suggested metrics and charts, and views an interactive dashboard. Each metric shows its source sheet, columns, filters, aggregation, and row count. The user can correct a wrong interpretation before saving the dashboard.

## MVP scope

Import one `.xlsx` workbook with one selected sheet; preview rows and inferred column types; let the user confirm dates, numbers, and categories; offer a small set of chart and metric suggestions; build an editable dashboard; and show the exact transformation behind each number. Handle missing values and invalid rows visibly. A local rule-based suggestion path should work without an API key. Add model-generated suggestions only after their output can be validated against the workbook schema.

## Architecture

An independent Next.js App Router and TypeScript application. Server Components read workbook and dashboard state; Server Actions handle user-initiated uploads, edits, and deletes; Route Handlers serve HTTP or exports if needed. Parse workbooks on the server without running macros or external links. Move large imports to durable jobs if processing time or size requires it.

## Data requirements

User-provided `.xlsx` workbooks with permission to process them, sheet and column metadata, row counts, detected and user-corrected types, formula/cached-value handling, and a small set of labeled example dashboards. Define file, row, and retention limits before accepting public uploads.

## Model and tool choices

Use code for parsing, filtering, grouping, and all calculations. Start with deterministic chart suggestions based on confirmed column types. A later AI assistant may explain the data and suggest chart configurations through a validated structured schema; it must not invent columns, rows, or computed values.

## Memory if applicable

Workbook data and saved dashboard configuration are user records. Conversation history, if added later, remains separate and cannot change calculations without an explicit user action.

## Evaluation plan

Recompute displayed totals and aggregates from source rows; check type inference and chart suitability against labeled workbooks; measure whether users can identify and fix wrong suggestions; test Spanish and English UI and explanations; record import time and resource use. Evaluate model suggestions against deterministic baselines if a model is introduced.

## Risks

Misread dates and number formats, misleading aggregation, hidden missing values, formula ambiguity, oversized workbooks, private data retention, and charts that imply relationships the data does not support.

## References and original approach

The linked repository is a learning reference, not a specification. Review its current code and license before reuse. Do not copy another author's code, prompts, interface, branding, assets, or reported results without appropriate permission and attribution.

| Reference project and exact URL | What to study | Relationship | What this implementation will do differently | License and attribution questions before reuse |
| --- | --- | --- | --- | --- |
| [Multi-Agent Financial Analyst](https://github.com/Sumanth077/Hands-On-AI-Engineering/tree/main/ai_agents/multi_agent_financial_analyst) | How source data is transformed into a user-facing analysis. | Technical analogy; it is a financial report workflow, not an Excel dashboard builder. | Build an editable dashboard from arbitrary user workbooks, with deterministic metrics, visible transformations, and human correction of chart suggestions. | Check the repository and relevant file or asset licenses, third-party dependencies, prompt and data provenance, attribution requirements, and whether reuse is permitted. |

## Status

Planned. The intended demo and MVP above are plans, not implemented features.

Read [CHECKLOG.md](CHECKLOG.md) for recent context and [docs/specs/tasks.md](docs/specs/tasks.md) for task status before starting this project.

## Next steps

Choose a small example workbook and define supported column types, limits, and the first three chart patterns. Specify the metric provenance contract before implementing the importer.
