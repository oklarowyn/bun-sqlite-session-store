# node-sqlite-session-store
A [node:sqlite](https://nodejs.org/api/sqlite.html) session store to be used with [express-session](https://github.com/expressjs/session)

[![npm version](https://badge.fury.io/js/node-sqlite-session-store.svg)](https://www.npmjs.com/package/node-sqlite-session-store)

## Installation

```bash
npm install node-sqlite-session-store
```

## Usage

```js
import session from 'express-session';
import SQLiteStore from 'node-sqlite-session-store';
import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('./path/to/db.sqlite');

app.use(session({
  store: new SQLiteStore({
    db,
    ttl: 86400
  }),
  secret: 'your-secret',
  resave: false,
  saveUninitialized: true
}));
