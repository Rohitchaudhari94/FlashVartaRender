/*require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const seedAdmin = require('./utils/seedAdmin');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set in server/.env');
  process.exit(1);
}

const app = express();

app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map((s) => s.trim()) : true,
  })
);
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'FlashVarta' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/news', require('./routes/news'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/submissions', require('./routes/submissions'));

// Unknown API routes
app.use('/api', (req, res) => res.status(404).json({ message: 'API route not found' }));

// Serve the built React app when it exists (production: `npm run build` then `npm start`)
const dist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: Object.values(err.errors).map((e) => e.message).join(', ') });
  }
  if (err.code === 11000) return res.status(409).json({ message: 'That email is already registered' });
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid id' });
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on the server' });
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(async () => {
    await seedAdmin();
    app.listen(PORT, () => console.log(`FlashVarta API running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to start server:', err.message);
    if (/whitelist|IP|ECONNREFUSED|ENOTFOUND|timed out|Server selection/i.test(err.message)) {
      console.error(
        'Tip: in MongoDB Atlas go to Network Access and allow your IP address (or 0.0.0.0/0 for development).'
      );
    }
    process.exit(1);
  });*/
```js
require('dotenv').config();

const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const connectDB = require('./config/db');
const seedAdmin = require('./utils/seedAdmin');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set in server environment variables.');
  process.exit(1);
}

const app = express();

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
  })
);

// CORS configuration
const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((url) => url.trim().replace(/\/+$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header (e.g. server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Parse JSON request bodies
app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    app: 'FlashVarta',
  });
});

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/news', require('./routes/news'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/submissions', require('./routes/submissions'));

// Unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({
    message: 'API route not found',
  });
});

// Serve React build if available
const dist = path.join(__dirname, '..', 'client', 'dist');

if (fs.existsSync(dist)) {
  app.use(express.static(dist));

  app.get('*', (req, res) => {
    res.sendFile(path.join(dist, 'index.html'));
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error('Request error:', err.message);

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      message: 'Origin not allowed by CORS',
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: Object.values(err.errors)
        .map((error) => error.message)
        .join(', '),
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      message: 'That email is already registered',
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      message: 'Invalid id',
    });
  }

  return res.status(500).json({
    message: 'Something went wrong on the server',
  });
});

// Render provides PORT through environment variables
const PORT = process.env.PORT || 5000;

// Start server after MongoDB connection and admin seeding
async function startServer() {
  try {
    await connectDB();
    await seedAdmin();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`FlashVarta API running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

startServer();
```
