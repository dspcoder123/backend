require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connectToDatabase } = require('./db');
const Visit = require('./models/Visit');
const https = require('https');

const app = express();

// Store recent requests to prevent duplicates (simple in-memory cache)
const recentRequests = new Map();
const DEDUP_WINDOW = 5000; // 5 seconds

// Helper function to clean IP address
function cleanIP(ip) {
  if (ip && ip.startsWith('::ffff:')) {
    return ip.substring(7);
  }
  return ip;
}

// Helper function to create dedup key
function createDedupKey(ip, path, userAgent) {
  return `${ip}:${path}:${userAgent.substring(0, 50)}`;
}

// Helper function to get IP location data from ipinfo.io
async function getIPLocation(ip) {
  return new Promise((resolve, reject) => {
    // Skip location lookup for local/private IPs
    if (ip === 'localhost' || ip === '::1' || ip === '127.0.0.1' || 
        ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
      resolve(null);
      return;
    }

    const options = {
      hostname: 'ipinfo.io',
      port: 443,
      path: `/${ip}/json`,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; IPTracker/1.0)'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const locationData = JSON.parse(data);
          resolve(locationData);
        } catch (error) {
          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      resolve(null);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve(null);
    });

    req.end();
  });
}

app.set('trust proxy', true);
app.use(cors({ origin: true, credentials: false }));
app.use(express.json());
app.use(morgan('combined'));

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// Test endpoint to check IP geolocation
app.get('/api/test-ip/:ip', async (req, res) => {
  try {
    const testIP = req.params.ip;
    const locationData = await getIPLocation(testIP);
    
    res.json({
      inputIP: testIP,
      location: locationData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get location data' });
  }
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

    // Get location data for the IP
    const locationData = await getIPLocation(ip);
    
    const visit = new Visit({ 
      ipAddress: ip, 
      path, 
      userAgent, 
      referer,
      location: locationData // This will be null for local IPs
    });
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

    // Get location data for the IP
    const locationData = await getIPLocation(ip);
    
    const visit = new Visit({ 
      ipAddress: ip, 
      path, 
      userAgent, 
      referer,
      location: locationData // This will be null for local IPs
    });
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

    // Check for duplicate requests
    const dedupKey = createDedupKey(ip, path, userAgent);
    const now = Date.now();
    
    if (recentRequests.has(dedupKey)) {
      const lastRequest = recentRequests.get(dedupKey);
      if (now - lastRequest < DEDUP_WINDOW) {
        // Duplicate request within window - skip saving
        return res.status(200).json({ saved: false, reason: 'duplicate' });
      }
    }
    
    // Record this request
    recentRequests.set(dedupKey, now);
    
    // Clean old entries periodically
    if (Math.random() < 0.1) { // 10% chance to clean
      for (const [key, timestamp] of recentRequests.entries()) {
        if (now - timestamp > DEDUP_WINDOW * 2) {
          recentRequests.delete(key);
        }
      }
    }

    // Get location data for the IP
    const locationData = await getIPLocation(ip);
    
    const visit = new Visit({ 
      ipAddress: ip, 
      path, 
      userAgent, 
      referer,
      location: locationData // This will be null for local IPs
    });
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


