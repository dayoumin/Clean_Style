CREATE TABLE IF NOT EXISTS test_results (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  style_key          TEXT    NOT NULL,
  style_name         TEXT    NOT NULL,
  score_principle    INTEGER NOT NULL,
  score_transparency INTEGER NOT NULL,
  score_independence INTEGER NOT NULL,
  six_principle      INTEGER NOT NULL DEFAULT 0,
  six_flexible       INTEGER NOT NULL DEFAULT 0,
  six_transparent    INTEGER NOT NULL DEFAULT 0,
  six_cautious       INTEGER NOT NULL DEFAULT 0,
  six_independent    INTEGER NOT NULL DEFAULT 0,
  six_cooperative    INTEGER NOT NULL DEFAULT 0,
  answers            TEXT    NOT NULL,
  created_at         TEXT    NOT NULL DEFAULT (datetime('now'))
);
