const fs = require('fs');
const path = require('path');
if (require.main === module) require('./env');
const pool = require('./db');

const PASSWORD = 'BUDO CLUB';

const USERS = [
  'Paul Vickraman',
  'V Sinod',
  'D Elamuruga Barati',
  'K Sabariraj',
  'M Rajeeshkumar',
  'N Ranjith Kumar',
  'M Dinesh',
  'S Manikandan',
  'master9',
  'master10',
].map((username) => ({ username, password: PASSWORD }));

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

  // Remove accounts no longer in the list (e.g. the old master1..master8)
  await pool.query('DELETE FROM users WHERE NOT (username = ANY($1))', [
    USERS.map((u) => u.username),
  ]);
}

module.exports = migrate;

if (require.main === module) {
  migrate()
    .then(() => { console.log('Migration and seed complete'); return pool.end(); })
    .catch((err) => { console.error(err); process.exit(1); });
}
