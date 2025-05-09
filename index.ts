import { Store } from 'express-session';
import { Database } from 'bun:sqlite';

interface SessionData {
  cookie: {
    maxAge?: number;
  };
  [key: string]: any;
}

interface StoreOptions {
  db: Database;
  ttl?: number;
  [key: string]: any;
}

interface SessionRow {
  sid: string;
  expires: number;
  data: string;
  count?: number;
}

export class SQLiteStore extends Store {
  private db: Database;
  private ttl: number;

  constructor(options: StoreOptions = { db: null }) {
    super(options);

    this.ttl = options.ttl ?? 86400; // Default TTL: 1 day in seconds
    this.db = options.db;
    this.initializeDb();
  }

  private initializeDb(): void {
    try {
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
          sid TEXT PRIMARY KEY,
          expires INTEGER,
          data TEXT,
          created_at INTEGER
        )
      `);

      this.db.exec('CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions (expires)');

      console.log('SQLite session store initialized successfully');
    } catch (err) {
      console.error('Failed to initialize SQLite session store:', err);
    }
  }

  get(sid: string, callback: (err?: any, session?: SessionData) => void): void {
    try {
      const row = this.db
        .prepare('SELECT * FROM sessions WHERE sid = ? AND expires > ?')
        .get(sid, Date.now()) as SessionRow | undefined;

      if (!row) {
        return callback();
      }

      const data = JSON.parse(row.data) as SessionData;
      return callback(null, data);
    } catch (err) {
      return callback(err);
    }
  }

  set(sid: string, session: SessionData, callback: (err?: any) => void): void {
    try {
      const expires = typeof session.cookie.maxAge === 'number'
        ? Date.now() + session.cookie.maxAge
        : Date.now() + (this.ttl * 1000);

      const data = JSON.stringify(session);

      this.db
        .prepare(
          `INSERT OR REPLACE INTO sessions (sid, expires, data, created_at)
          VALUES (?, ?, ?, ?)`
        )
        .run(sid, expires, data, Date.now());

      callback();
    } catch (err) {
      callback(err);
    }
  }

  destroy(sid: string, callback: (err?: any) => void): void {
    try {
      this.db
        .prepare('DELETE FROM sessions WHERE sid = ?')
        .run(sid);
      callback();
    } catch (err) {
      callback(err);
    }
  }

  clear(callback: (err?: any) => void): void {
    try {
      this.db.exec('DELETE FROM sessions');
      callback();
    } catch (err) {
      callback(err);
    }
  }

  length(callback: (err?: any, length?: number) => void): void {
    try {
      const row = this.db
        .prepare('SELECT COUNT(*) AS count FROM sessions')
        .get() as SessionRow;
      callback(null, row ? row.count : 0);
    } catch (err) {
      callback(err);
    }
  }

  touch(sid: string, session: SessionData, callback: (err?: any) => void): void {
    try {
      const expires = typeof session.cookie.maxAge === 'number'
        ? Date.now() + session.cookie.maxAge
        : Date.now() + (this.ttl * 1000);

      this.db
        .prepare('UPDATE sessions SET expires = ? WHERE sid = ?')
        .run(expires, sid);

      callback();
    } catch (err) {
      callback(err);
    }
  }

  prune(): void {
    try {
      this.db
        .prepare('DELETE FROM sessions WHERE expires < ?')
        .run(Date.now());
      console.log('Expired sessions pruned');
    } catch (err) {
      console.error('Failed to prune expired sessions:', err);
    }
  }
}

export default SQLiteStore;