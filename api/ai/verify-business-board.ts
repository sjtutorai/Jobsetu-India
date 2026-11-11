import { GoogleGenAI, Type } from '@google/genai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ verified: false, error: 'Method Not Allowed' });
  }

  try {
    const { imageBase64, businessName = '', businessCategory = '', gstinNumber = '' } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({
        verified: false,
        error: 'Please upload a valid Business / Coaching Classes Sign Board image.'
      });
    }

    if (!apiKey) {
      return res.status(500).json({
        verified: false,
        error: 'GEMINI_API_KEY is not configured in server environment.'
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const match = imageBase64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    const mimeType = match ? match[1] : 'image/jpeg';
    const base64Data = match ? match[2] : imageBase64;

    const imagePart = {
      inlineData: {
        mimeType,
        data: base64Data
      }
    };

    const textPart = {
      text: `Analyze this uploaded Business / Coaching Classes Sign Board & Premises photo for JOBSETU India Employer Verification.
Declared Business Name: "${businessName}"
Declared Category: "${businessCategory}"
Declared GSTIN / Registration Number: "${gstinNumber}"

Tasks:
1. Check if this image shows a real business storefront, coaching classes sign board, banner, or office board.
2. Read any visible text on the board, specifically looking for the Business / Coaching Classes Name and the 15-character Indian GSTIN number displayed on the board.
3. Verify whether the board shows the GSTIN number or business signage clearly.`
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        systemInstruction:
          'You are an AI Business Compliance & Sign Board Auditor for JOBSETU India. Inspect uploaded photos of Coaching Classes boards, shop signboards, and business premises to verify that the board displays the business name and GSTIN number.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            verified: {
              type: Type.BOOLEAN,
              description: 'True if the image shows a business/coaching classes board or premises with identifiable signage/GSTIN.'
            },
            hasSignBoard: {
              type: Type.BOOLEAN,
              description: 'True if a business or coaching classes sign board is visible in the image.'
            },
            detectedBusinessName: {
              type: Type.STRING,
              description: 'The business or coaching classes name detected on the board, if any.'
            },
            detectedGstin: {
              type: Type.STRING,
              description: 'The GSTIN number detected on the board, if visible.'
            },
            feedback: {
              type: Type.STRING,
              description: 'Clear verification summary for the business owner.'
            }
          },
          required: ['verified', 'hasSignBoard', 'detectedBusinessName', 'detectedGstin', 'feedback']
        }
      }
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    return res.status(200).json({
      verified: Boolean(parsed.verified),
      hasSignBoard: Boolean(parsed.hasSignBoard),
      detectedBusinessName: parsed.detectedBusinessName || businessName,
      detectedGstin: parsed.detectedGstin || '',
      feedback:
        parsed.feedback ||
        'Business sign board image analyzed by JOBSETU AI Verification Engine.'
    });
  } catch (error: any) {
    console.error('Gemini Business Board Vercel Verification Error:', error);
    return res.status(500).json({
      verified: false,
      error: error.message || 'Failed to verify business board image with AI.'
    });
  }
}
