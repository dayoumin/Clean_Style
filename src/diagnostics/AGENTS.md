# Diagnostic Ownership Rules

- Each folder under `src/diagnostics/` owns one instrument's questions, response schema, scoring,
  interpretation, versioning, storage policy, safety rules, and validation status.
- Shared contracts belong in `src/diagnostics/core/`; shared contracts must not assume the adult
  three-axis score shape.
- `adult-integrity` may adapt the existing `src/data/questions.ts` implementation during migration.
- `workplace-respect` remains separate from adult integrity even when both appear in the plus product.
- `student-integrity` must not import adult questions, adult style types, adult score utilities,
  adult history, or AI chat.
- Student prototypes start with `scoringVersion: unscored-p0`. Do not add representative-style
  classification until the validation gate explicitly permits it.
- Every persisted or shared response contract must carry stable IDs and instrument/scoring versions.
