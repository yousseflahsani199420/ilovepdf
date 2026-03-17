const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

/* ================= SECURITY ================= */

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],

        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://unpkg.com",
          "https://www.googletagmanager.com",
          "https://www.google-analytics.com",
          "https://static.copyrighted.com"
        ],

        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com"
        ],

        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com"
        ],

        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https://www.google-analytics.com",
          "https://www.googletagmanager.com",
          "https://static.copyrighted.com"
        ],

        connectSrc: [
          "'self'",
          "https://www.google-analytics.com",
          "https://www.googletagmanager.com",
          "https://fonts.gstatic.com",
          "https://static.copyrighted.com"
        ],

        frameSrc: [
          "'self'",
          "https://www.googletagmanager.com"
        ],

        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"]
      }
    },

    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    frameguard: { action: "deny" },
    xssFilter: true,
    noSniff: true,
    hidePoweredBy: true
  })
);

/* ================= MIDDLEWARE ================= */

app.use(cors());
app.use(compression());

/* ================= STATIC FILES ================= */

app.use(express.static(path.join(__dirname), {
  maxAge: "1y",
  setHeaders: (res, filePath) => {
    if (filePath.endsWith(`${path.sep}sw.js`)) {
      res.setHeader("Cache-Control", "no-cache");
      return;
    }
    if (filePath.match(/\.(html)$/)) {
      res.setHeader("Cache-Control", "no-cache");
    }
  }
}));

/* ================= ROUTES ================= */

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'FreePDF Pro'
  });
});

/* ================= 404 HANDLER ================= */

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

/* ================= ERROR HANDLER ================= */

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Server Error');
});

/* ================= START SERVER ================= */

app.listen(PORT, () => {
  console.log(`🚀 FreePDF Pro server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
