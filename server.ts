import express from 'express';
import path from 'path';
import https from 'https';
import querystring from 'querystring';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API: Status of TypingDNA integration
  app.get('/api/typingdna/status', (req, res) => {
    const hasCloudApi = Boolean(
      process.env.TYPINGDNA_API_KEY && process.env.TYPINGDNA_API_SECRET
    );
    res.json({
      status: 'ok',
      hasCloudApi,
      sourceRepo: 'https://github.com/TypingDNA/TypingDnaRecorder-JavaScript',
      nodeClientRepo: 'https://github.com/TypingDNA/TypingDnaClient-NodeJs',
    });
  });

  // API: TypingDNA Match proxy endpoint
  app.post('/api/typingdna/match', async (req, res) => {
    const { tp1, tp2, quality = 2 } = req.body;

    if (!tp1 || !tp2) {
      res.status(400).json({ error: 'Both tp1 and tp2 patterns are required' });
      return;
    }

    const apiKey = process.env.TYPINGDNA_API_KEY;
    const apiSecret = process.env.TYPINGDNA_API_SECRET;

    if (apiKey && apiSecret) {
      // Proxy to official TypingDNA API
      try {
        const postData = querystring.stringify({
          tp1,
          tp2,
          quality,
        });

        const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
        const options = {
          hostname: 'api.typingdna.com',
          port: 443,
          path: '/match',
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData),
            Authorization: `Basic ${auth}`,
          },
        };

        const apiReq = https.request(options, (apiRes) => {
          let body = '';
          apiRes.on('data', (chunk) => {
            body += chunk;
          });
          apiRes.on('end', () => {
            try {
              const parsed = JSON.parse(body);
              res.json({
                ...parsed,
                source: 'cloud_api',
              });
            } catch (err) {
              res.status(500).json({
                error: 'Failed to parse TypingDNA Cloud API response',
                raw: body,
              });
            }
          });
        });

        apiReq.on('error', (e) => {
          res.status(500).json({
            error: 'TypingDNA API Request Error',
            message: e.message,
          });
        });

        apiReq.write(postData);
        apiReq.end();
        return;
      } catch (err: any) {
        console.error('TypingDNA Cloud Match error:', err);
      }
    }

    // Fallback response indicating client-side local biometric comparison is active
    res.json({
      message: 'Cloud API credentials not configured; local biometric matching engine active.',
      source: 'local_engine',
    });
  });

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
