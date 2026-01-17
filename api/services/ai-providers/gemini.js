// api/services/ai-providers/gemini.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiProvider {
  constructor() {
    if (process.env.GEMINI_API_KEY) {
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
  }

  async translateBatch({ texts, sourceLanguage, targetLanguage, model, customInstructions }) {
    if (!this.genAI) {
      throw new Error('Gemini API key not configured');
    }

    const genModel = this.genAI.getGenerativeModel({ model: model || 'gemini-1.5-pro' });

    const prompt = `You are a professional subtitle translator. Translate the following subtitles from ${sourceLanguage || 'auto-detected language'} to ${targetLanguage}.

Rules:
- Maintain the original meaning and tone
- Keep translations concise for subtitle timing
- Preserve any formatting tags (like <i>, <b>, {\\an8}, etc.)
- Return ONLY the translations, one per line, in the same order as input
- Do not add numbering or extra formatting
${customInstructions ? `\nAdditional instructions: ${customInstructions}` : ''}

Subtitles to translate:
${texts.map((text, i) => `${i + 1}. ${text}`).join('\n')}`;

    const result = await genModel.generateContent(prompt);
    const response = await result.response;
    const translatedText = response.text().trim();

    const translations = translatedText.split('\n')
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(line => line.length > 0);

    while (translations.length < texts.length) {
      translations.push(texts[translations.length]);
    }

    return translations.slice(0, texts.length);
  }

  async translateSingle({ text, sourceLanguage, targetLanguage, model }) {
    if (!this.genAI) {
      throw new Error('Gemini API key not configured');
    }

    const genModel = this.genAI.getGenerativeModel({ model: model || 'gemini-1.5-pro' });

    const prompt = `Translate the following subtitle text from ${sourceLanguage || 'auto-detected language'} to ${targetLanguage}. Return only the translation, nothing else.

Text: ${text}`;

    const result = await genModel.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  }
}

module.exports = GeminiProvider;
