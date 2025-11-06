export const migration_001 = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    sync_status TEXT NOT NULL DEFAULT 'synced'
  );

  CREATE TABLE IF NOT EXISTS vinyl_records (
    id TEXT PRIMARY KEY NOT NULL,
    band TEXT NOT NULL,
    album TEXT NOT NULL,
    year INTEGER NOT NULL,
    number_of_tracks INTEGER NOT NULL,
    photo_url TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    sync_status TEXT NOT NULL DEFAULT 'synced',
    FOREIGN KEY (owner_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS loans (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    vinyl_record_id TEXT NOT NULL,
    loan_date TEXT NOT NULL,
    return_date TEXT,
    sync_status TEXT NOT NULL DEFAULT 'synced',
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (vinyl_record_id) REFERENCES vinyl_records(id)
  );

  CREATE TABLE IF NOT EXISTS sync_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    payload TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`;
