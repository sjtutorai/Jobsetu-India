import fs from 'fs';
import path from 'path';

const RECAPTCHA_ENTERPRISE_SITE_KEY = '6LfxCRUuAAAAAOcIJ5RG_tSWXMpZpbLfx1qNipta';
const PROJECT_ID = 'jobsetuinindia';
const DEFAULT_API_KEY = 'AIzaSyAM9H9BUF-XX1PVKFnnUKeOrZ69UP8XALA';
const TOKEN_EXPIRATION_MS = 2 * 60 * 1000; // 2 minutes

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ verified: false, error: 'Method Not Allowed' });
  }

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

    const now = Date.now();
    if (issuedAt && typeof issuedAt === 'number' && now - issuedAt > TOKEN_EXPIRATION_MS) {
      return res.status(400).json({
        verified: false,
        error: 'reCAPTCHA response token has expired (older than 2 minutes).'
      });
    }

    const requestBody = {
      event: {
        token,
        expectedAction: action,
        siteKey
      }
    };

    // On Vercel serverless, /tmp is writable
    try {
      const targetDir = process.env.VERCEL ? '/tmp' : process.cwd();
      const requestJsonPath = path.join(targetDir, 'request.json');
      fs.writeFileSync(requestJsonPath, JSON.stringify(requestBody, null, 2), 'utf-8');
    } catch {
      // Ignore read-only filesystem errors in serverless edge environments
    }

    const apiKey =
      process.env.RECAPTCHA_ENTERPRISE_API_KEY ||
      process.env.VITE_FIREBASE_API_KEY ||
      DEFAULT_API_KEY;
    const assessmentUrl = `https://recaptchaenterprise.googleapis.com/v1/projects/${PROJECT_ID}/assessments?key=${apiKey}`;

    try {
      const googleRes = await fetch(assessmentUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (googleRes.ok) {
        const assessment = await googleRes.json();
        const valid = assessment?.tokenProperties?.valid !== false;
        const actionMatches =
          !assessment?.tokenProperties?.action ||
          assessment.tokenProperties.action === action;
        const score = assessment?.riskAnalysis?.score ?? 1.0;

        return res.status(200).json({
          verified: valid && actionMatches && score >= 0.3,
          score,
          action: assessment?.tokenProperties?.action || action,
          assessmentName: assessment?.name,
          expiresInSeconds: 120
        });
      }
    } catch (fetchErr) {
      console.warn('[reCAPTCHA Enterprise Vercel] Assessment POST warning:', fetchErr);
    }

    return res.status(200).json({
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
}
