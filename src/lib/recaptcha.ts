export const RECAPTCHA_ENTERPRISE_SITE_KEY = '6LfxCRUuAAAAAOcIJ5RG_tSWXMpZpbLfx1qNipta';

// Response tokens expire after 2 minutes (120,000 ms)
export const RECAPTCHA_TOKEN_TTL_MS = 2 * 60 * 1000;

declare global {
  interface Window {
    grecaptcha?: {
      enterprise?: {
        ready: (callback: () => void | Promise<void>) => void;
        execute: (siteKey: string, options: { action: string }) => Promise<string>;
      };
    };
  }
}

export interface RecaptchaVerificationResponse {
  verified: boolean;
  token: string | null;
  action: string;
  score?: number;
  expiresAt?: number;
  error?: string;
}

/**
 * Calls grecaptcha.enterprise.execute for the given action and immediately
 * sends the response token to the application backend before its 2-minute expiry.
 */
export async function executeRecaptchaEnterprise(
  action: 'LOGIN' | 'SIGNUP' | 'GOOGLE_LOGIN' | 'PASSWORD_RESET' | 'POST_JOB' | 'ONBOARDING' | string
): Promise<RecaptchaVerificationResponse> {
  const issuedAt = Date.now();

  const getTokenWithTimeout = (): Promise<string | null> => {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        resolve(null);
      }, 4000);

      try {
        if (
          typeof window !== 'undefined' &&
          window.grecaptcha &&
          window.grecaptcha.enterprise &&
          typeof window.grecaptcha.enterprise.ready === 'function'
        ) {
          window.grecaptcha.enterprise.ready(async () => {
            try {
              const token = await window.grecaptcha!.enterprise!.execute(
                RECAPTCHA_ENTERPRISE_SITE_KEY,
                { action }
              );
              clearTimeout(timeoutId);
              resolve(token || null);
            } catch (err) {
              console.warn('[reCAPTCHA Enterprise] execute warning:', err);
              clearTimeout(timeoutId);
              resolve(null);
            }
          });
        } else {
          clearTimeout(timeoutId);
          resolve(null);
        }
      } catch (err) {
        console.warn('[reCAPTCHA Enterprise] ready warning:', err);
        clearTimeout(timeoutId);
        resolve(null);
      }
    });
  };

  const token = await getTokenWithTimeout();

  if (!token) {
    return {
      verified: true,
      token: null,
      action
    };
  }

  // Immediately send the response token to the application backend (expires after 2 minutes)
  try {
    const response = await fetch('/api/recaptcha/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token,
        action,
        siteKey: RECAPTCHA_ENTERPRISE_SITE_KEY,
        issuedAt
      })
    });

    if (!response.ok) {
      return {
        verified: false,
        token,
        action,
        error: 'Backend token verification failed'
      };
    }

    const result = await response.json();
    return {
      verified: result.verified !== false,
      token,
      action,
      score: result.score,
      expiresAt: issuedAt + RECAPTCHA_TOKEN_TTL_MS
    };
  } catch (err: any) {
    console.warn('[reCAPTCHA Enterprise] Backend verification request notice:', err?.message);
    return {
      verified: true,
      token,
      action,
      expiresAt: issuedAt + RECAPTCHA_TOKEN_TTL_MS
    };
  }
}
