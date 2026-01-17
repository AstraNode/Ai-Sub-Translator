// api/services/ai-providers/grok.js
class GrokProvider {
  constructor() {
    this.apiKey = process.env.GROK_API_KEY;
    this.baseUrl = 'https://api.x.ai/v1';
  }

  async translateBatch({ texts, sourceLanguage, targetLanguage, model, customInstructions }) {
    if (!this.apiKey) {
      throw new Error('Grok API key not configured');
    }

    const systemPrompt = `You are a professional subtitle translator. Translate the following subtitles from ${sourceLanguage || 'auto-detected language'} to ${targetLanguage}.

Rules:
- Maintain the original meaning and tone
- Keep translations concise for subtitle timing
- Preserve any formatting tags
- Return ONLY the translations, one per line, in the same order
${customInstructions ? `\nAdditional instructions: ${customInstructions}` : ''}`;

    const userPrompt = texts.map((text, i) => `${i + 1}. ${text}`).join('\n');

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: model || 'grok-2',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.statusText}`);
    }

    const data = await response.json();
    const translatedText = data.choices[0].message.content.trim();

    const translations = translatedText.split('\n')
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(line => line.length > 0);

    while (translations.length < texts.length) {
      translations.push(texts[translations.length]);
    }

    return translations.slice(0, texts.length);
  }

  async translateSingle({ text, sourceLanguage, targetLanguage, model }) {
    if (!this.apiKey) {
      throw new Error('Grok API key not configured');
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: model || 'grok-2',
        messages: [
          {
            role: 'system',
            content: `Translate subtitle text from ${sourceLanguage || 'auto-detected language'} to ${targetLanguage}. Return only the translation.`
          },
          { role: 'user', content: text }
        ],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  }
}

module.exports = GrokProvider;
