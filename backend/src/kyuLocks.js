const express = require('express');
const pool = require('./db');
const { requireAuth } = require('./auth');

const router = express.Router();
router.use(requireAuth);

const KYUS = Array.from({ length: 7 }, (_, i) => `Kyu ${7 - i}`);
// A lock not refreshed by its owner's heartbeat within this window is considered abandoned
const STALE_SECONDS = 20;

function cleanupStale() {
  return pool.query(
    `DELETE FROM kyu_locks WHERE locked_at < now() - ($1 || ' seconds')::interval`,
    [STALE_SECONDS]
  );
}

function validKyu(req, res, next) {
  if (!KYUS.includes(req.params.kyu)) return res.status(400).json({ error: 'Invalid Kyu' });
  next();
}

router.get('/', async (req, res, next) => {
  try {
    await cleanupStale();
    const { rows } = await pool.query('SELECT kyu, locked_by FROM kyu_locks');
    const byKyu = Object.fromEntries(rows.map((r) => [r.kyu, r.locked_by]));
    res.json(
      KYUS.map((kyu) => ({
        kyu,
        locked: kyu in byKyu,
        mine: byKyu[kyu] === req.sessionID,
      }))
    );
  } catch (err) {
    next(err);
  }
});

// Acquire the lock. Also serves as the heartbeat: the current owner calling again refreshes it.
router.post('/:kyu', validKyu, async (req, res, next) => {
  try {
    await cleanupStale();
    const { rows } = await pool.query(
      `INSERT INTO kyu_locks (kyu, locked_by) VALUES ($1, $2)
       ON CONFLICT (kyu) DO UPDATE SET locked_at = now()
         WHERE kyu_locks.locked_by = EXCLUDED.locked_by
       RETURNING kyu`,
      [req.params.kyu, req.sessionID]
    );
    if (rows.length === 0) return res.status(409).json({ error: `${req.params.kyu} is in use by another master` });
    res.json({ kyu: req.params.kyu, locked: true, mine: true });
  } catch (err) {
    next(err);
  }
});

// Release the lock (only the owner can release it)
router.delete('/:kyu', validKyu, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM kyu_locks WHERE kyu = $1 AND locked_by = $2', [
      req.params.kyu,
      req.sessionID,
    ]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
