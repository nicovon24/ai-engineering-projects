# Spreadsheet Dashboard Studio task status

This is the source of task status for this project. Compare it with [CHECKLOG.md](../../CHECKLOG.md), [README.md](../../README.md), Git state, and any later feature requirements before acting. The project is planned; no application is implemented.

| ID | Work | Status | Acceptance for the next checkpoint |
| --- | --- | --- | --- |
| SDS-001 | Choose a permitted example `.xlsx` workbook, supported column types, and file/row limits. | Planned | Sample, limits, and ambiguous dates, numbers, formulas, and missing values are documented. |
| SDS-002 | Specify traceable metric and chart contracts. | Planned | Every metric exposes source sheet, columns, filters, aggregation, and row count; model suggestions cannot invent fields. |
| SDS-003 | Build a local upload-to-editable-dashboard prototype. | Planned | The user can correct inferred types and suggestions, and deterministic calculations can be recomputed from source rows. |

Next actionable task: **SDS-001**. Create `docs/features/<slug>/requirements.md` when implementation work begins; do not treat the README as proof of working behavior.
