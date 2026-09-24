const express = require('express');
const pool = require('./db');

const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Not authenticated' });
  next();
}

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    const { rows } = await pool.query(
      'SELECT id, username FROM users WHERE username = $1 AND password = $2',
      [username, password]
    );
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid username or password' });

    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.user = { id: rows[0].id, username: rows[0].username };
      res.json({ user: req.session.user });
    });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', async (req, res, next) => {
  await pool.query('DELETE FROM kyu_locks WHERE locked_by = $1', [req.sessionID]).catch(() => {});
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.session.user });
});

module.exports = { router, requireAuth };
