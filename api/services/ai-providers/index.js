// api/services/ai-providers/index.js
const OpenAIProvider = require('./openai');
const GeminiProvider = require('./gemini');
// If you don't have a specific grok.js file, Grok can use OpenAIProvider logic (see below)
// But assuming you have the file, we keep the require:
let GrokProvider;
try {
  GrokProvider = require('./grok');
} catch (e) {
  console.warn('Grok provider file missing, checking if OpenAI can handle it...');
}

class AIProviders {
  static getProvider(name) {
    console.log(`[Factory] Getting provider for: ${name}`);

    switch (name) {
      case 'openai':
        if (!process.env.OPENAI_API_KEY) {
            console.error('Missing OPENAI_API_KEY');
        }
        return new OpenAIProvider(process.env.OPENAI_API_KEY);

      case 'gemini':
        if (!process.env.GEMINI_API_KEY) {
            console.error('Missing GEMINI_API_KEY');
        }
        return new GeminiProvider(process.env.GEMINI_API_KEY);

      case 'grok':
        // 1. Try to use dedicated Grok provider if file exists
        if (GrokProvider) {
          return new GrokProvider(process.env.GROK_API_KEY || process.env.XAI_API_KEY);
        }
        
        // 2. Fallback: Use OpenAI Provider with Grok Base URL (Since Grok is OpenAI compatible)
        const grokKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
        if (!grokKey) console.error('Missing GROK_API_KEY / XAI_API_KEY');
        
        // Pass key AND base URL to OpenAI provider
        return new OpenAIProvider(grokKey, 'https://api.x.ai/v1');

      default:
        console.error(`Unknown provider requested: ${name}`);
        return null;
    }
  }

  static listProviders() {
    return ['openai', 'gemini', 'grok'];
  }
}

module.exports = AIProviders;
