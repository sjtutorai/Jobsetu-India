import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { task, context, prompt } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured in the Vercel environment variables.'
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    let systemInstruction = `You are the JOBSETU AI Employment Assistant, dedicated to connecting workers and employers across India.
Your mission is to provide actionable, culturally tuned, highly professional vocational and employment guidance.
Tone: Encouraging, concise, respectful, professional, and practical.
Use Indian Rupees (₹), standard Indian employment terminology (PF/ESI, ITI, Diploma, Fresher, Notice Period), and concise bullet points.`;

    let fullPrompt = '';

    if (task === 'recommend_jobs') {
      systemInstruction += ` You are recommending the best jobs for a candidate based on their profile.`;
      fullPrompt = `Candidate Profile:
${JSON.stringify(context?.workerProfile || {}, null, 2)}

Available Job Listings:
${JSON.stringify(context?.availableJobs || [], null, 2)}

Task: Analyze the candidate's skills, experience, location, and preferences. Recommend the top 3 most suitable opportunities. For each, explain:
1. Why it is a strong match
2. Key skills that qualify the worker
3. Specific tips to get hired for this role
Provide a concise summary.`;
    } else if (task === 'improve_resume') {
      systemInstruction += ` You are an expert Indian employment career advisor crafting high-impact resumes.`;
      fullPrompt = `Worker Vocational Details:
${JSON.stringify(context?.workerProfile || {}, null, 2)}

User request/input: ${prompt || 'Generate a professional resume summary, bulleted work achievements, and recommended industry certifications.'}

Generate:
1. Professional Headline & 3-sentence Executive Summary
2. Key Competencies list (Action-oriented)
3. Formatted Work Experience bullets using action verbs
4. Recommended certifications (ITI, NSDC, PMKVY, NPTEL or relevant Indian standards)
5. Practical advice to stand out to verified employers on JOBSETU.`;
    } else if (task === 'improve_job_description') {
      systemInstruction += ` You are an expert HR consultant optimizing Indian job postings for high application quality and quick hiring.`;
      fullPrompt = `Draft Job Details:
Title: ${context?.title || 'Not specified'}
Category: ${context?.category || 'General'}
Draft Description: ${context?.description || prompt || ''}
Responsibilities: ${context?.responsibilities || ''}
Skills: ${(context?.requiredSkills || []).join(', ')}

Please rewrite and improve this into a compelling, professional job listing with:
1. Catchy, clear Job Title suggestion
2. Compelling Employer Value Proposition (Why join us)
3. Clear Key Responsibilities (4-6 bullet points)
4. Must-have Requirements & Preferred Skills
5. Fair compensation & benefits guidelines.`;
    } else if (task === 'suggest_skills') {
      systemInstruction += ` Suggest top in-demand technical, vocational, and soft skills in India.`;
      fullPrompt = `Job Title or Category: ${context?.title || context?.category || prompt}
Provide a list of 8-12 high-demand skills for this occupation in the Indian job market, separated into:
- Core Technical/Vocational Skills
- Tools, Machinery or Software
- Soft Skills & Customer Etiquette.`;
    } else if (task === 'recruitment_ad') {
      systemInstruction += ` Create an attractive hiring advertisement for WhatsApp, LinkedIn, and print/posters in India.`;
      fullPrompt = `Job Details:
${JSON.stringify(context?.job || {}, null, 2)}
Additional Instructions: ${prompt || 'Create a clean, attractive hiring ad'}

Generate:
1. Professional Social/WhatsApp Ad copy (with clear emojis, salary, contact prompt)
2. Short SMS/Telegram broadcast announcement
3. Key bullet points highlighting perks (PF/ESI, incentive, flexible shift).`;
    } else {
      systemInstruction += ` Answer employment-related questions, guide first-time job seekers and employers on navigating JOBSETU, labor laws, interview etiquette, and career progression in India.`;
      fullPrompt = prompt || 'How can JOBSETU help me find work or hire skilled staff?';
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'text/plain'
      }
    });

    const responseText = response.text || 'Unable to generate response. Please try again.';
    return res.status(200).json({ result: responseText });
  } catch (error: any) {
    console.error('Gemini Assistant Vercel Error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to process AI assistant request.'
    });
  }
}
