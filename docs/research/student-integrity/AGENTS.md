# Student Integrity Documentation Rules

- This folder is the durable source for student planning, evidence, validation, safeguarding, and
  implementation decisions.
- Treat the four student styles as provisional feedback language, not validated personality types.
- Distinguish scenario choice intention from observed real-world behavior in every document.
- New evidence must first be recorded in `literature-review-log.html`, then registered with a stable
  evidence ID in `korean-evidence-base.html`, then linked from affected documents.
- Keep policy, theory, Korean empirical evidence, tool-development methods, and operating examples
  at separate evidence levels.
- Update `product-and-student-implementation-plan.html` when implementation order or release gates
  change.
- Update `student-safeguarding-operations.html` before enabling student storage, classroom
  aggregation, free text, or real-experience collection.
- Do not store research raw data, identifiable student information, consent records, or private
  school materials in this folder or in Git.
- Treat `content/student-integrity/item-bank.json` as the canonical candidate-item source. Regenerate
  `item-bank-data.js` with `corepack pnpm docs:student-item-bank`; do not edit the generated file.
- Candidate items remain out of the student app until content, student-language, and safeguarding
  reviews are all approved and the required student cognitive interviews are documented.
- Use `item-review-protocol.html` as the shared expert-review and student cognitive-interview
  procedure. Store only de-identified issue summaries and revision decisions in Git, never raw
  interview notes or student statements.
