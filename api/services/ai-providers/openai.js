// api/services/ai-providers/openai.js
const OpenAI = require('openai');

class OpenAIProvider {
  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
  }

  async translateBatch({ texts, sourceLanguage, targetLanguage, model, customInstructions }) {
    if (!this.client) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = `You are a professional subtitle translator. Translate the following subtitles from ${sourceLanguage || 'auto-detected language'} to ${targetLanguage}. 
    
Rules:
- Maintain the original meaning and tone
- Keep translations concise for subtitle timing
- Preserve any formatting tags (like <i>, <b>, {\\an8}, etc.)
- Return ONLY the translations, one per line, in the same order
- Do not add numbering or extra formatting
${customInstructions ? `\nAdditional instructions: ${customInstructions}` : ''}`;

    const userPrompt = texts.map((text, i) => `${i + 1}. ${text}`).join('\n');

    const response = await this.client.chat.completions.create({
      model: model || 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 4096
    });

    const translatedText = response.choices[0].message.content.trim();
    const translations = translatedText.split('\n')
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(line => line.length > 0);

    // Ensure we have the same number of translations
    while (translations.length < texts.length) {
      translations.push(texts[translations.length]);
    }

    return translations.slice(0, texts.length);
  }

  async translateSingle({ text, sourceLanguage, targetLanguage, model }) {
    if (!this.client) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await this.client.chat.completions.create({
      model: model || 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `Translate the following subtitle text from ${sourceLanguage || 'auto-detected language'} to ${targetLanguage}. Return only the translation, nothing else.`
        },
        { role: 'user', content: text }
      ],
      temperature: 0.3,
      max_tokens: 1024
    });

    return response.choices[0].message.content.trim();
  }
}

module.exports = OpenAIProvider;
