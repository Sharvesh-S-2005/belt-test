const express = require('express');
const pool = require('./db');
const { requireAuth } = require('./auth');

const router = express.Router();
router.use(requireAuth);

const KYUS = Array.from({ length: 7 }, (_, i) => `Kyu ${7 - i}`);
const COLUMNS = {
  ex_basics_comb: { flag: 'ex_saved', max: 40 },
  kata: { flag: 'kata_saved', max: 40 },
};

async function holdsLock(kyu, sessionID) {
  const { rows } = await pool.query('SELECT 1 FROM kyu_locks WHERE kyu = $1 AND locked_by = $2', [kyu, sessionID]);
  return rows.length > 0;
}

// Students of a Kyu (youngest first) with their marks and per-column saved flags
router.get('/:kyu', async (req, res, next) => {
  try {
    const { kyu } = req.params;
    if (!KYUS.includes(kyu)) return res.status(400).json({ error: 'Invalid Kyu' });
    if (!(await holdsLock(kyu, req.sessionID))) {
      return res.status(403).json({ error: 'You do not hold the lock for this Kyu' });
    }

    // Make sure every student has a marks row (e.g. students inserted outside the API),
    // pre-filling Others from the mark recorded at registration
    await pool.query(
      `INSERT INTO marks (student_id, others, others_saved)
       SELECT s.id, s.others_marks, true FROM students s
       WHERE s.test_grade = $1 AND NOT EXISTS (SELECT 1 FROM marks m WHERE m.student_id = s.id)`,
      [kyu]
    );

    const { rows } = await pool.query(
      `SELECT s.id AS student_id, s.name, s.age,
              m.ex_basics_comb, m.kata, m.others, m.ex_saved, m.kata_saved, m.others_saved
       FROM students s JOIN marks m ON m.student_id = s.id
       WHERE s.test_grade = $1
       ORDER BY s.age ASC, s.id ASC`,
      [kyu]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// Body: { kyu, column, values: [{ student_id, value }] } — must cover every student in the Kyu
router.post('/save-column', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { kyu, column, values } = req.body || {};
    if (!KYUS.includes(kyu)) return res.status(400).json({ error: 'Invalid Kyu' });
    const col = COLUMNS[column];
    if (!col) return res.status(400).json({ error: 'Invalid column' });
    if (!Array.isArray(values)) return res.status(400).json({ error: 'values must be an array' });
    if (!(await holdsLock(kyu, req.sessionID))) {
      return res.status(403).json({ error: 'You do not hold the lock for this Kyu' });
    }

    const { rows: students } = await pool.query('SELECT id FROM students WHERE test_grade = $1', [kyu]);
    const ids = new Set(students.map((s) => s.id));
    const given = new Map();
    for (const v of values) {
      const n = v.value === '' || v.value === null ? NaN : Number(v.value);
      if (!ids.has(v.student_id) || !Number.isInteger(n) || n < 0 || n > col.max) {
        return res.status(400).json({ error: `Marks must be whole numbers from 0 to ${col.max} for every student` });
      }
      given.set(v.student_id, n);
    }
    if (given.size !== ids.size) {
      return res.status(400).json({ error: 'Enter marks for every student before saving' });
    }

    await client.query('BEGIN');
    for (const [id, n] of given) {
      // column and flag names come from the fixed COLUMNS map above, never from user input
      await client.query(
        `UPDATE marks SET ${column} = $1, ${col.flag} = true, updated_at = now() WHERE student_id = $2`,
        [n, id]
      );
    }
    await client.query('COMMIT');
    res.json({ ok: true, saved: given.size });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
});

module.exports = router;
