# Product Composition Rules

- A product definition selects diagnostics and product-level capabilities. It must not contain
  question text, scoring logic, result interpretation, or diagnostic evidence.
- Supported products are `clean-style`, `clean-style-plus`, and `clean-style-student`.
- `clean-style-student` must select only `student-integrity`; AI chat and workplace-respect are
  always disabled for that product.
- Product selection comes from `NEXT_PUBLIC_APP_VARIANT` with a conservative `default` fallback.
- Keep definitions declarative and test the full product matrix whenever a definition changes.
- Do not use Git branch names to infer the active product.
