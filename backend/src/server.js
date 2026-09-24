require('./env');
const path = require('path');
const express = require('express');
const session = require('express-session');
const migrate = require('./migrate');
const { router: authRouter } = require('./auth');
const studentsRouter = require('./students');
const kyuLocksRouter = require('./kyuLocks');
const marksRouter = require('./marks');
const resultsRouter = require('./results');

const app = express();
// Render (and similar hosts) terminate TLS at a proxy in front of the app
app.set('trust proxy', 1);
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    // No maxAge: session cookie lasts until the browser is closed or the user logs out
    cookie: { httpOnly: true, sameSite: 'lax', secure: 'auto' },
  })
);

app.use('/api/auth', authRouter);
app.use('/api/students', studentsRouter);
app.use('/api/kyu-locks', kyuLocksRouter);
app.use('/api/marks', marksRouter);
app.use('/api/results', resultsRouter);

// Serve the built frontend; unknown non-API routes fall back to index.html for client-side routing
const distDir = path.join(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(distDir));
app.get(/^(?!\/api\/).*/, (req, res) => res.sendFile(path.join(distDir, 'index.html')));

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
