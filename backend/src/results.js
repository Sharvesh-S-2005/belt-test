const express = require('express');
const pool = require('./db');
const { requireAuth } = require('./auth');

const router = express.Router();
router.use(requireAuth);

const KYUS = Array.from({ length: 7 }, (_, i) => `Kyu ${7 - i}`);

// Ranked results for a Kyu. Only available once all three columns are saved for every student.
router.get('/:kyu', async (req, res, next) => {
  try {
    const { kyu } = req.params;
    if (!KYUS.includes(kyu)) return res.status(400).json({ error: 'Invalid Kyu' });
    const lock = await pool.query('SELECT 1 FROM kyu_locks WHERE kyu = $1 AND locked_by = $2', [kyu, req.sessionID]);
    if (lock.rows.length === 0) return res.status(403).json({ error: 'You do not hold the lock for this Kyu' });

    // Same order as the mark sheet, so the original S.No matches what the master saw
    const { rows } = await pool.query(
      `SELECT s.name, m.ex_basics_comb, m.kata, m.others, m.ex_saved, m.kata_saved, m.others_saved
       FROM students s JOIN marks m ON m.student_id = s.id
       WHERE s.test_grade = $1
       ORDER BY s.age ASC, s.id ASC`,
      [kyu]
    );
    if (rows.length === 0) return res.status(409).json({ error: 'No students in this Kyu' });
    if (rows.some((r) => !(r.ex_saved && r.kata_saved && r.others_saved))) {
      return res.status(409).json({ error: 'Save all three columns before viewing results' });
    }

    const students = rows.map((r, i) => ({
      original_sno: i + 1,
      name: r.name,
      total: r.ex_basics_comb + r.kata + r.others,
      kata: r.kata,
      ex_basics_comb: r.ex_basics_comb,
    }));
    // Highest total first; ties broken by Kata, then Ex/Basics/Comb, then original S.No order
    students.sort(
      (a, b) =>
        b.total - a.total ||
        b.kata - a.kata ||
        b.ex_basics_comb - a.ex_basics_comb ||
        a.original_sno - b.original_sno
    );

    // Equal totals share a rank; the next distinct total gets the next rank (1, 1, 2, ...)
    let rank = 0;
    const results = students.map((s, i) => {
      if (i === 0 || s.total !== students[i - 1].total) rank++;
      return { sno: i + 1, name: s.name, total: s.total, rank, original_sno: s.original_sno };
    });
    res.json(results);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
