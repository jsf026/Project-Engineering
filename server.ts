/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

// Parse incoming request payloads
app.use(express.json());

// Initialize server-side Gemini client lazily
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// REST Api health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    apiConfigured: !!process.env.GEMINI_API_KEY,
  });
});

// Gemini Natural Language to Test Steps Engine
app.post('/api/generate-steps', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid prompt parameter.' });
  }

  try {
    const ai = getAi();
    
    const stepSchema = {
      type: Type.OBJECT,
      properties: {
        type: {
          type: Type.STRING,
          description: "One of standard types: 'goto', 'click', 'type', 'assert', 'wait', 'hover', 'scroll'.",
        },
        payload: {
          type: Type.OBJECT,
          properties: {
            url: { type: Type.STRING, description: "URL for 'goto' step. Optional." },
            selector: { type: Type.STRING, description: "Default fallback selector, e.g., '#search', '.btn', or '[name=q]'. Optional." },
            value: { type: Type.STRING, description: "Text input value for 'type' step. Optional." },
            timeout: { type: Type.INTEGER, description: "Wait duration in milliseconds for 'wait' step. Optional." },
            selectors: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING, description: "HTML element ID without hash. Optional." },
                testId: { type: Type.STRING, description: "data-testid or similar QA attribute value. Optional." },
                label: { type: Type.STRING, description: "aria-label or label text. Optional." },
                name: { type: Type.STRING, description: "name tag attribute. Optional." },
                className: { type: Type.STRING, description: "Tailwind or standard HTML classes. Optional." },
                text: { type: Type.STRING, description: "Inner text of element, e.g., 'Save', 'Submit'. Optional." },
              },
            },
            activeSelectorType: {
              type: Type.STRING,
              description: "Best estimated selector category chosen from: 'id', 'testId', 'label', 'name', 'className', 'text'.",
            },
          },
          required: ["activeSelectorType"],
        },
      },
      required: ["type", "payload"],
    };

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        steps: {
          type: Type.ARRAY,
          items: stepSchema,
          description: "Chronological test steps translated from natural language prompt specifications.",
        },
      },
      required: ["steps"],
    };

    const systemInstruction = `You are TestFlow AI's core translation system.
Convert manual test requirements described in natural language into visual test steps for automated browser test runners (Playwright, Selenium, Cypress).
Identify the step type accurately. Provide high-priority smart selectors for buttons, textboxes, links mentioned.
Ensure that:
1. For typing: capture correct values and selectors.
2. For clicking: locate the target and provide smart selector attributes (selectors.id, selectors.testId,Selectors.className, selectors.text, selectors.label).
3. Set the activeSelectorType matching the best available attribute in selectors (prefer testId if specified, then id, then name, label, text, class).
4. For waits: capture standard timeouts in ms.
Keep selectors robust. Empty or generic urls should fallback to valid relative or absolute paths.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Translate the following user test requirement: "${prompt}"`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema,
      },
    });

    const data = JSON.parse(response.text || '{"steps": []}');
    return res.json(data);

  } catch (error: any) {
    console.error('Gemini automation step translation failed:', error);
    
    // Transparent failover status allowing peaceful mock fallback
    if (error.message?.includes('GEMINI_API_KEY')) {
      return res.status(403).json({
        error: "AUTHENTICATION_REQUIRED",
        message: "Gemini API key is not configured yet. Please configure GEMINI_API_KEY in Settings > Secrets.",
      });
    }
    return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: error.message });
  }
});

// Serve frontend assets
async function startServer() {
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
    console.log(`[TestFlow AI] server booting on http://0.0.0.0:${PORT}`);
  });
}

startServer();
