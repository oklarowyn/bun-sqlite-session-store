# bun-sqlite-session-store
A [bun:sqlite](https://bun.sh/docs/api/sqlitel) session store to be used with [express-session](https://github.com/expressjs/session)



## Installation

```bash
bun add bun-sqlite-session-store 
bun init
```

## Usage

```js
import session from 'express-session';
import SQLiteStore from 'bun-sqlite-session-store';
import { Database } from 'bun:sqlite';

const db = new Database(":memory:"); // or new Database('path/to/your/database.db')

app.use(session({
  store: new SQLiteStore({
    db,
    ttl: 86400
  }),
  secret: 'your-secret',
  resave: false,
  saveUninitialized: true
}));
