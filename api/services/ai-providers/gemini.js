// api/services/ai-providers/gemini.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiProvider {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('Gemini API key is missing');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async translateBatch(texts, sourceLang, targetLang, modelId, customInstructions) {
    // 1. SANITIZE THE MODEL ID
    // If frontend sends 'gemini-1.5-pro' (which causes 404), switch to Flash
    let validModelId = modelId;
    if (!validModelId || validModelId === 'gemini-1.5-pro') {
      validModelId = 'gemini-1.5-flash';
    }

    console.log(`[Gemini] Requesting model: ${validModelId}`);

    try {
      const model = this.genAI.getGenerativeModel({ 
        model: validModelId,
        generationConfig: {
            // Force JSON response (works better on Flash models)
            responseMimeType: "application/json"
        }
      });

      const prompt = this.buildPrompt(texts, sourceLang, targetLang, customInstructions);
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseResponse(text, texts.length);
    } catch (error) {
      console.error('[Gemini] API Error:', error);
      
      // If the specific model fails, try one last fallback to gemini-pro (1.0)
      if (error.message.includes('404') || error.message.includes('not found')) {
         console.warn('[Gemini] Model not found, attempting fallback to gemini-pro');
         return this.fallbackTranslate(texts, sourceLang, targetLang, customInstructions);
      }
      
      throw new Error(`Gemini Error: ${error.message}`);
    }
  }

  // Fallback method for older models
  async fallbackTranslate(texts, sourceLang, targetLang, customInstructions) {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = this.buildPrompt(texts, sourceLang, targetLang, customInstructions);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return this.parseResponse(response.text(), texts.length);
  }

  async translateSingle(text, sourceLang, targetLang, modelId) {
    let validModelId = modelId;
    if (!validModelId || validModelId === 'gemini-1.5-pro') {
      validModelId = 'gemini-1.5-flash';
    }

    const model = this.genAI.getGenerativeModel({ model: validModelId });
    const prompt = `Translate to ${targetLang}. Text: "${text}"`;
    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  buildPrompt(texts, sourceLang, targetLang, customInstructions) {
    return `Translate these subtitles from ${sourceLang || 'auto'} to ${targetLang}.
    RULES:
    1. Output strictly a JSON Array of strings.
    2. Maintain exact length: ${texts.length}.
    3. Preserve HTML tags.
    ${customInstructions ? `4. Instruction: ${customInstructions}` : ''}
    
    Input: ${JSON.stringify(texts)}
    Output JSON:`;
  }

  parseResponse(responseText, expectedLength) {
    try {
      let clean = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const json = JSON.parse(clean);
      if (!Array.isArray(json)) throw new Error('Not an array');
      return json;
    } catch (e) {
      throw new Error('AI returned invalid JSON');
    }
  }
}

module.exports = GeminiProvider;
