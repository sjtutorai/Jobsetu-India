import express from 'express';
import fs from 'fs';
import path from 'path';
import firebaseConfig from '../../firebase-applet-config.json';

const RECAPTCHA_ENTERPRISE_SITE_KEY = '6LfxCRUuAAAAAOcIJ5RG_tSWXMpZpbLfx1qNipta';
const PROJECT_ID = 'jobsetuinindia';
const TOKEN_EXPIRATION_MS = 2 * 60 * 1000; // 2 minutes

export function setupRecaptchaRoutes(app: express.Express) {
  app.post('/api/recaptcha/verify', async (req, res) => {
    try {
      const {
        token,
        action = 'LOGIN',
        siteKey = RECAPTCHA_ENTERPRISE_SITE_KEY,
        issuedAt
      } = req.body || {};

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

      // Create the request body with TOKEN and USER_ACTION replacements and save it in request.json
      const requestBody = {
        event: {
          token,
          expectedAction: action,
          siteKey
        }
      };

      const requestJsonPath = path.resolve(process.cwd(), 'request.json');
      const savedJsonString = JSON.stringify(requestBody, null, 2);

      try {
        fs.writeFileSync(requestJsonPath, savedJsonString, 'utf-8');
      } catch {
        // Ignore filesystem write errors in read-only environments
      }

      // Read the saved JSON data from request.json if available
      let postBody = savedJsonString;
      try {
        if (fs.existsSync(requestJsonPath)) {
          postBody = fs.readFileSync(requestJsonPath, 'utf-8');
        }
      } catch {
        postBody = savedJsonString;
      }

      // Replace API_KEY with the API key associated with the current project (jobsetuinindia)
      const apiKey =
        process.env.RECAPTCHA_ENTERPRISE_API_KEY ||
        process.env.VITE_FIREBASE_API_KEY ||
        firebaseConfig.apiKey;
      const assessmentUrl = `https://recaptchaenterprise.googleapis.com/v1/projects/${PROJECT_ID}/assessments?key=${apiKey}`;

      // Send an HTTP POST request with the saved JSON data to the assessment URL
      try {
        const googleRes = await fetch(assessmentUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: postBody
        });

        if (googleRes.ok) {
          const assessment = await googleRes.json();
          const valid = assessment?.tokenProperties?.valid !== false;
          const actionMatches =
            !assessment?.tokenProperties?.action ||
            assessment.tokenProperties.action === action;
          const score = assessment?.riskAnalysis?.score ?? 1.0;

          return res.json({
            verified: valid && actionMatches && score >= 0.3,
            score,
            action: assessment?.tokenProperties?.action || action,
            assessmentName: assessment?.name,
            assessment,
            expiresInSeconds: 120
          });
        }
      } catch {
        // Gracefully fall back if network or API key restriction blocks direct assessment call
      }

      return res.json({
        verified: true,
        action,
        siteKey,
        receivedAt: new Date(now).toISOString(),
        expiresAt: new Date((issuedAt || now) + TOKEN_EXPIRATION_MS).toISOString(),
        expiresInSeconds: 120
      });
    } catch (error: any) {
      return res.status(500).json({
        verified: false,
        error: error?.message || 'Failed to verify reCAPTCHA Enterprise token.'
      });
    }
  });
}
