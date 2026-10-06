CREATE TABLE IF NOT EXISTS ordenes (
  ref       TEXT PRIMARY KEY,
  monto     INTEGER,
  email     TEXT,
  nombre    TEXT,
  telefono  TEXT,
  items     TEXT,
  estado    TEXT,
  txid      TEXT,
  creado    TEXT
);
