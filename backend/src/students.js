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

router.post('/', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const name = String(req.body.name ?? '').trim();
    const cls = String(req.body.class ?? '').trim();
    const test_grade = req.body.test_grade;
    const age = Number(req.body.age);
    const others_marks = Number(req.body.others_marks);

    const errors = {};
    if (!name) errors.name = 'Name is required';
    if (!Number.isInteger(age) || age <= 0) errors.age = 'Age must be a positive whole number';
    if (!Number.isInteger(others_marks) || others_marks < 0 || others_marks > 20)
      errors.others_marks = 'Others Marks must be a whole number from 0 to 20';
    if (!GRADES.includes(test_grade)) errors.test_grade = 'Select a valid test grade';
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

module.exports = router;
