const express = require('express');
const pool = require('./db');
const { requireAuth } = require('./auth');

const router = express.Router();
router.use(requireAuth);

const GRADES = Array.from({ length: 7 }, (_, i) => `Kyu ${7 - i}`);

router.get('/', async (req, res, next) => {
  try {
    const { test_grade } = req.query;
    const { rows } = test_grade
      ? await pool.query('SELECT * FROM students WHERE test_grade = $1 ORDER BY age, id', [test_grade])
      : await pool.query('SELECT * FROM students ORDER BY id');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// Normalises and validates the student fields collected on the Add Students page
function parseStudent(body) {
  const name = String(body.name ?? '').trim();
  const cls = String(body.class ?? '').trim();
  const test_grade = body.test_grade;
  const age = Number(body.age);
  const others_marks = Number(body.others_marks);

  const errors = {};
  if (!name) errors.name = 'Name is required';
  if (!Number.isInteger(age) || age <= 0) errors.age = 'Age must be a positive whole number';
  if (!Number.isInteger(others_marks) || others_marks < 0 || others_marks > 20)
    errors.others_marks = 'Others Marks must be a whole number from 0 to 20';
  if (!GRADES.includes(test_grade)) errors.test_grade = 'Select a valid test grade';
  return { name, cls, test_grade, age, others_marks, errors };
}

router.post('/', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { name, cls, test_grade, age, others_marks, errors } = parseStudent(req.body || {});
    if (Object.keys(errors).length) return res.status(400).json({ error: 'Validation failed', errors });

    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO students (name, age, others_marks, class, test_grade)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, age, others_marks, cls || null, test_grade]
    );
    await client.query(
      'INSERT INTO marks (student_id, others, others_saved) VALUES ($1, $2, true)',
      [rows[0].id, others_marks]
    );
    await client.query('COMMIT');
    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
});

// Edit a student. Others Marks is mirrored into the marks row so the grading sheet shows the new value.
router.put('/:id', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid student' });
    const { name, cls, test_grade, age, others_marks, errors } = parseStudent(req.body || {});
    if (Object.keys(errors).length) return res.status(400).json({ error: 'Validation failed', errors });

    await client.query('BEGIN');
    const { rows } = await client.query(
      `UPDATE students SET name = $1, age = $2, others_marks = $3, class = $4, test_grade = $5
       WHERE id = $6 RETURNING *`,
      [name, age, others_marks, cls || null, test_grade, id]
    );
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Student not found' });
    }
    await client.query(
      `INSERT INTO marks (student_id, others, others_saved) VALUES ($1, $2, true)
       ON CONFLICT (student_id) DO UPDATE SET others = EXCLUDED.others, others_saved = true, updated_at = now()`,
      [id, others_marks]
    );
    await client.query('COMMIT');
    res.json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
});

// Delete a student; their marks row goes with it (ON DELETE CASCADE)
router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid student' });
    const { rowCount } = await pool.query('DELETE FROM students WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Student not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
