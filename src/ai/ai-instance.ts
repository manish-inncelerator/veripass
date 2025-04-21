import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import Handlebars from 'handlebars';

// Register the 'eq' helper
Handlebars.registerHelper('eq', (a, b) => a === b);

export const ai = genkit({
  promptDir: './prompts',
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
    }),
  ],
  model: 'googleai/gemini-2.0-flash',
});
