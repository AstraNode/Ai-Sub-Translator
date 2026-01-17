// api/services/ai-providers/gemini.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiProvider {
  constructor(apiKey) {
    // Support both Environment Variable AND Constructor Argument
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (key) {
      this.genAI = new GoogleGenerativeAI(key);
    }
  }

  async translateBatch({ texts, sourceLanguage, targetLanguage, model, customInstructions }) {
    if (!this.genAI) {
      throw new Error('Gemini API key not configured');
    }

    // --- FIX: PREVENT 404 ERROR ---
    // If model is missing or is the broken 'pro' version, switch to Flash
    let targetModel = model;
    if (!targetModel || targetModel === 'gemini-1.5-pro') {
      targetModel = 'gemini-1.5-flash';
    }
    // -----------------------------

    console.log(`[Gemini] Batch translating with model: ${targetModel}`);

    try {
      const genModel = this.genAI.getGenerativeModel({ model: targetModel });

      const prompt = `You are a professional subtitle translator. Translate the following subtitles from ${sourceLanguage || 'auto-detected language'} to ${targetLanguage}.

Rules:
- Maintain the original meaning and tone
- Keep translations concise
- Preserve formatting tags (<i>, <b>, {\\an8})
- Return ONLY the translations, one per line, matching the input order
- NO numbering, NO markdown, NO extra text
${customInstructions ? `\nAdditional instructions: ${customInstructions}` : ''}

Subtitles to translate:
${texts.map((text, i) => `Line_${i}: ${text}`).join('\n')}`;

      const result = await genModel.generateContent(prompt);
      const response = await result.response;
      const translatedText = response.text().trim();

      // Robust parsing to handle cases where AI adds "Line_X:" or numbering
      const translations = translatedText.split('\n')
        .map(line => line.replace(/^(Line_\d+:|\d+\.)\s*/i, '').trim())
        .filter(line => line.length > 0);

      // Fallback: If AI missed lines, fill with original text to prevent sync errors
      while (translations.length < texts.length) {
        translations.push(texts[translations.length]);
      }

      return translations.slice(0, texts.length);

    } catch (error) {
      console.error('Gemini Batch Error:', error);
      // Nice error message for the frontend
      if (error.message.includes('404')) {
        throw new Error(`Model ${targetModel} not found. Please select 'Gemini 1.5 Flash'.`);
      }
      throw error;
    }
  }

  async translateSingle({ text, sourceLanguage, targetLanguage, model }) {
    if (!this.genAI) {
      throw new Error('Gemini API key not configured');
    }

    // --- FIX: PREVENT 404 ERROR ---
    let targetModel = model;
    if (!targetModel || targetModel === 'gemini-1.5-pro') {
      targetModel = 'gemini-1.5-flash';
    }
    // -----------------------------

    const genModel = this.genAI.getGenerativeModel({ model: targetModel });

    const prompt = `Translate subtitle from ${sourceLanguage || 'auto'} to ${targetLanguage}. Return ONLY the translation. Text: ${text}`;

    const result = await genModel.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  }
}

module.exports = GeminiProvider;
