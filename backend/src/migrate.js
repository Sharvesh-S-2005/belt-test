const fs = require('fs');
const path = require('path');
if (require.main === module) require('./env');
const pool = require('./db');

const USERS = Array.from({ length: 10 }, (_, i) => ({
  username: `master${i + 1}`,
  password: 'karate@2024',
}));

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);

  for (const u of USERS) {
    await pool.query(
      `INSERT INTO users (username, password) VALUES ($1, $2)
       ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password`,
      [u.username, u.password]
    );
  }
}

module.exports = migrate;

if (require.main === module) {
  migrate()
    .then(() => { console.log('Migration and seed complete'); return pool.end(); })
    .catch((err) => { console.error(err); process.exit(1); });
}
