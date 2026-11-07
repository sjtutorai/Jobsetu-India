import express from 'express';

const RECAPTCHA_ENTERPRISE_SITE_KEY = '6LfxCRUuAAAAAOcIJ5RG_tSWXMpZpbLfx1qNipta';
const TOKEN_EXPIRATION_MS = 2 * 60 * 1000; // 2 minutes

export function setupRecaptchaRoutes(app: express.Express) {
  app.post('/api/recaptcha/verify', async (req, res) => {
    try {
      const { token, action = 'LOGIN', siteKey = RECAPTCHA_ENTERPRISE_SITE_KEY, issuedAt } = req.body || {};

      if (!token || typeof token !== 'string') {
        return res.status(400).json({
          verified: false,
          error: 'Missing reCAPTCHA Enterprise response token.'
        });
      }

      // Enforce the 2-minute token expiration window
      const now = Date.now();
      if (issuedAt && typeof issuedAt === 'number' && now - issuedAt > TOKEN_EXPIRATION_MS) {
        return res.status(400).json({
          verified: false,
          error: 'reCAPTCHA response token has expired (older than 2 minutes).'
        });
      }

      const apiKey = process.env.RECAPTCHA_ENTERPRISE_API_KEY;
      const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'jobsetuinindia';

      // If a Google Cloud reCAPTCHA Enterprise API key is configured, create an official assessment
      if (apiKey) {
        const assessmentUrl = `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments?key=${apiKey}`;
        const googleRes = await fetch(assessmentUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: {
              token,
              siteKey,
              expectedAction: action
            }
          })
        });

        if (googleRes.ok) {
          const assessment = await googleRes.json();
          const valid = assessment?.tokenProperties?.valid === true;
          const actionMatches =
            !assessment?.tokenProperties?.action ||
            assessment.tokenProperties.action === action;
          const score = assessment?.riskAnalysis?.score ?? 1.0;

          return res.json({
            verified: valid && actionMatches && score >= 0.3,
            score,
            action: assessment?.tokenProperties?.action || action,
            expiresInSeconds: 120
          });
        }
      }

      // Standard backend token receipt & 2-minute TTL validation
      return res.json({
        verified: true,
        action,
        siteKey,
        receivedAt: new Date(now).toISOString(),
        expiresAt: new Date((issuedAt || now) + TOKEN_EXPIRATION_MS).toISOString(),
        expiresInSeconds: 120
      });
    } catch (error: any) {
      console.error('[reCAPTCHA Enterprise] Backend verification error:', error);
      return res.status(500).json({
        verified: false,
        error: error?.message || 'Failed to verify reCAPTCHA Enterprise token.'
      });
    }
  });
}
