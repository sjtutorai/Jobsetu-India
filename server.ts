import express from 'express';
import { createServer as createViteServer } from 'vite';
import { setupGeminiRoutes } from './src/server/geminiRouter';
import { setupRecaptchaRoutes } from './src/server/recaptchaRouter';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Mount API routes
  setupGeminiRoutes(app);
  setupRecaptchaRoutes(app);

  // Google Search Console site verification endpoint
  app.get('/googlee648bd7d4ad0dfeb.html', (_req, res) => {
    res.type('text/html').send('google-site-verification: googlee648bd7d4ad0dfeb.html');
  });

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', platform: 'Jobsetu India' });
  });

  // Setup Vite middlewares for SSR/dev SPA serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[JOBSETU] Full-stack Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[JOBSETU] Failed to start server:', err);
  process.exit(1);
});
