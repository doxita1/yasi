CREATE TABLE progress (
  owner TEXT NOT NULL,
  k TEXT NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY (owner, k)
);
CREATE TABLE attempts (
  owner TEXT NOT NULL,
  id TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (owner, id)
);
CREATE TABLE drafts (
  owner TEXT NOT NULL,
  k TEXT NOT NULL,
  text TEXT NOT NULL,
  revision INTEGER NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (owner, k)
);
CREATE TABLE draft_conflicts (
  owner TEXT NOT NULL,
  k TEXT NOT NULL,
  id TEXT NOT NULL,
  text TEXT NOT NULL,
  base_revision INTEGER NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (owner, k, id)
);
CREATE TABLE recordings (
  owner TEXT NOT NULL,
  id TEXT NOT NULL,
  type TEXT NOT NULL,
  size INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  object_key TEXT NOT NULL,
  PRIMARY KEY (owner, id)
);
CREATE TABLE ai_selection (
  owner TEXT PRIMARY KEY NOT NULL,
  provider TEXT NOT NULL
);
CREATE TABLE ai_config (
  owner TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  deep_model TEXT,
  secret TEXT,
  PRIMARY KEY (owner, provider)
);
