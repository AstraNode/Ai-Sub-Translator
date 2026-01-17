// api/services/ai-providers/index.js
const OpenAIProvider = require('./openai');
const GeminiProvider = require('./gemini');
const GrokProvider = require('./grok');

class AIProviders {
  static providers = {
    openai: new OpenAIProvider(),
    gemini: new GeminiProvider(),
    grok: new GrokProvider()
  };

  static getProvider(name) {
    return this.providers[name] || null;
  }

  static listProviders() {
    return Object.keys(this.providers);
  }
}

module.exports = AIProviders;
