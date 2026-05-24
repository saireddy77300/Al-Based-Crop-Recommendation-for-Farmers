import express from 'express';
import cors from 'cors';
import dns from 'dns';

// Fix for Node.js 18+ "fetch failed" IPv6 issues
dns.setDefaultResultOrder('ipv4first');

const app = express();
app.use(cors());
app.use(express.json());
// Log incoming requests for debugging
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.url);
  next();
});

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCGb9vCC9O1WSlt6T9vf_BhVUMgLLRvy7I';
// Use the Google Generative Language API host (generativelanguage.googleapis.com)
const GL_HOST = 'https://generativelanguage.googleapis.com';

const knownModels = [
  'gemini-1.5-mini',
  'text-bison-001',
  'chat-bison-001',
];

async function listModels() {
  const url = `${GL_HOST}/v1/models?key=${GEMINI_API_KEY}`;
  const res = await fetch(url);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

app.post('/api/gemini', async (req, res) => {
  const { ph, moisture } = req.body;
  if (typeof ph !== 'number' || typeof moisture !== 'number') {
    return res.status(400).json({ error: 'ph and moisture must be numbers' });
  }

  try {
    const prompt = `Analyze soil data for pH ${ph} and moisture ${moisture}%. Return a JSON object with keys diag, sol, dose, risk, msg, and crops. Use only JSON and no markdown or extra text.`;
    
    const fallbackModels = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash-lite', 'gemini-2.0-flash'];
    let lastErrorStatus = 500;
    let lastErrorText = '';

    for (const model of fallbackModels) {
      const generateUrl = `${GL_HOST}/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      console.log(`[API] Trying model: ${model}`);

      let response;
      try {
        response = await fetch(generateUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt }
                ]
              }
            ]
          }),
        });
      } catch (err) {
        console.warn(`[API] Model ${model} fetch threw an error:`, err.message);
        lastErrorText = err.message;
        lastErrorStatus = 500;
        continue;
      }

      const text = await response.text();
      
      // If we get a 429 (Rate Limit) or 503 (Unavailable), we skip to the next model.
      if (!response.ok) {
        lastErrorStatus = response.status;
        lastErrorText = text;
        
        if (response.status === 429 || response.status >= 500) {
          console.warn(`[API] Model ${model} failed with ${response.status}. Retrying with next model...`);
          continue; 
        }
        
        // If it's a 400 bad request, don't retry, just return it.
        console.error(`[API] Model ${model} returned non-OK:`, response.status, text.substring(0, 300));
        return res.status(response.status).send(text);
      }

      try {
        const data = JSON.parse(text);
        return res.json(data);
      } catch (err) {
        console.error('[API] Failed to parse JSON response:', err.message);
        return res.status(502).send(text);
      }
    }
    
    // If all models in the fallback array are exhausted
    console.error('[API] All models exhausted. Last error:', lastErrorStatus);
    return res.status(lastErrorStatus).send(lastErrorText);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
console.log('registered POST /api/gemini');

// Expose model list for debugging
app.get('/api/models', async (req, res) => {
  try {
    const models = await listModels();
    return res.json(models);
  } catch (err) {
    console.error('Failed to list models:', err);
    return res.status(500).json({ error: err.message });
  }
});
console.log('registered GET /api/models');

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Gemini proxy server running on http://localhost:${port}`);
  console.log('cwd:', process.cwd());
  try {
    const routes = app._router && app._router.stack
      ? app._router.stack.filter(r => r.route).map(r => Object.keys(r.route.methods)[0].toUpperCase() + ' ' + r.route.path)
      : [];
    console.log('routes:', routes);
  } catch (e) {
    console.error('Failed to list routes:', e.message);
  }
});
