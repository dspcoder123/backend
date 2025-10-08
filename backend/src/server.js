require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connectToDatabase } = require('./db');
const Visit = require('./models/Visit');

const app = express();

// Helper function to clean IP address
function cleanIP(ip) {
  if (ip && ip.startsWith('::ffff:')) {
    return ip.substring(7);
  }
  return ip;
}

app.set('trust proxy', true);
app.use(cors({ origin: true, credentials: false }));
app.use(express.json());
app.use(morgan('combined'));

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// Lightweight GET endpoint to be used as an image tracking pixel
app.get('/api/pixel', async (req, res) => {
  try {
    const rawIP =
      req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
      req.socket.remoteAddress ||
      req.ip ||
      'unknown';
    
    const ip = cleanIP(rawIP);

    const path = req.query?.path || '/';
    const userAgent = req.headers['user-agent'] || '';
    const referer = req.headers['referer'] || req.headers['referrer'] || '';

    const visit = new Visit({ ipAddress: ip, path, userAgent, referer });
    await visit.save();

    // 1x1 transparent GIF
    const gifBase64 = 'R0lGODlhAQABAIAAAP///////yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    const buf = Buffer.from(gifBase64, 'base64');
    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.status(200).end(buf);
  } catch (error) {
    res.status(500).end();
  }
});

// Additional endpoint for tracking page views with more details
app.get('/api/track', async (req, res) => {
  try {
    const rawIP =
      req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
      req.socket.remoteAddress ||
      req.ip ||
      'unknown';
    
    const ip = cleanIP(rawIP);

    const path = req.query?.path || '/';
    const userAgent = req.headers['user-agent'] || '';
    const referer = req.headers['referer'] || req.headers['referrer'] || '';

    const visit = new Visit({ ipAddress: ip, path, userAgent, referer });
    await visit.save();

    res.json({ success: true, path });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

app.post('/api/track', async (req, res) => {
  try {
    const rawIP =
      req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
      req.socket.remoteAddress ||
      req.ip ||
      'unknown';
    
    const ip = cleanIP(rawIP);

    const path = req.body?.path || req.query?.path || '/';
    const userAgent = req.headers['user-agent'] || '';
    const referer = req.headers['referer'] || req.headers['referrer'] || '';

    const visit = new Visit({ ipAddress: ip, path, userAgent, referer });
    await visit.save();

    res.status(201).json({ saved: true });
  } catch (error) {
    res.status(500).json({ saved: false });
  }
});

const port = parseInt(process.env.PORT || '4000', 10);

connectToDatabase()
  .then(() => {
    app.listen(port, () => {
      /* server started */
    });
  })
  .catch(() => {
    process.exit(1);
  });


