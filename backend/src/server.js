require('./env');
const express = require('express');
const session = require('express-session');
const migrate = require('./migrate');
const { router: authRouter } = require('./auth');
const studentsRouter = require('./students');
const kyuLocksRouter = require('./kyuLocks');
const marksRouter = require('./marks');
const resultsRouter = require('./results');

const app = express();
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    // No maxAge: session cookie lasts until the browser is closed or the user logs out
    cookie: { httpOnly: true, sameSite: 'lax' },
  })
);

app.use('/api/auth', authRouter);
app.use('/api/students', studentsRouter);
app.use('/api/kyu-locks', kyuLocksRouter);
app.use('/api/marks', marksRouter);
app.use('/api/results', resultsRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const port = process.env.PORT || 4000;

migrate()
  .then(() => app.listen(port, () => console.log(`API listening on http://localhost:${port}`)))
  .catch((err) => {
    console.error('Startup failed:', err.message);
    process.exit(1);
  });
