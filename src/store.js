import { Store } from 'express-session';

export class SQLiteStore extends Store {
  constructor({ db, ...options } = {}) {
    super(options);

    this.ttl = options.ttl ?? 86400; // Default TTL: 1 day in seconds
    this.db = db;
    this.initializeDb();
  }

  initializeDb() {
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

  get(sid, callback) {
    try {
      let row = this.db
        .prepare('SELECT * FROM sessions WHERE sid = ? AND expires > ?')
        .get(sid, Date.now());

      if (!row) {
        return callback();
      }

      let data = JSON.parse(row.data);
      return callback(null, data);
    } catch (err) {
      return callback(err);
    }
  }

  set(sid, session, callback) {
    try {
      let expires = typeof session.cookie.maxAge === 'number'
        ? Date.now() + session.cookie.maxAge
        : Date.now() + (this.ttl * 1000);

      let data = JSON.stringify(session);

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

  destroy(sid, callback) {
    try {
      this.db
        .prepare('DELETE FROM sessions WHERE sid = ?')
        .run(sid);
      callback();
    } catch (err) {
      callback(err);
    }
  }

  clear(callback) {
    try {
      this.db.exec('DELETE FROM sessions');
      callback();
    } catch (err) {
      callback(err);
    }
  }

  length(callback) {
    try {
      let row = this.db
        .prepare('SELECT COUNT(*) AS count FROM sessions')
        .get();
      callback(null, row ? row.count : 0);
    } catch (err) {
      callback(err);
    }
  }

  touch(sid, session, callback) {
    try {
      let expires = typeof session.cookie.maxAge === 'number'
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

  prune() {
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