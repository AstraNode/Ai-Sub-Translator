// api/services/ai-providers/grok.js
class GrokProvider {
  constructor(apiKey) {
    // Check constructor arg, then XAI (standard), then GROK (custom)
    this.apiKey = apiKey || process.env.XAI_API_KEY || process.env.GROK_API_KEY;
    this.baseUrl = 'https://api.x.ai/v1';
  }

  async translateBatch({ texts, sourceLanguage, targetLanguage, model, customInstructions }) {
    if (!this.apiKey) {
      throw new Error('Grok/xAI API key not configured. Set XAI_API_KEY in .env');
    }

    // 1. Sanitize Model: Default to 'grok-beta' if generic 'grok-1' or empty is passed
    // 'grok-beta' is the standard accessible model. 'grok-2' might require specific tier access.
    let validModel = model;
    if (!validModel || validModel === 'grok-1') {
      validModel = 'grok-beta';
    }

    const systemPrompt = `You are a professional subtitle translator. Translate from ${sourceLanguage || 'auto'} to ${targetLanguage}.

RULES:
1. Return ONLY a raw JSON Array of strings.
2. Maintain exact array length (${texts.length} items).
3. Preserve HTML tags (<i>, <b>).
4. Do NOT use Markdown code blocks.
${customInstructions ? `Note: ${customInstructions}` : ''}`;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: validModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify(texts) }
        ],
        temperature: 0.1 // Low temperature for consistent JSON
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      // Handle specific 403 Forbidden
      if (response.status === 403) {
        throw new Error(`Grok Forbidden (403): Invalid Key or no access to model '${validModel}'. Response: ${errText}`);
      }
      throw new Error(`Grok API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();

    // Robust JSON Parsing
    try {
      // Remove markdown if Grok adds it (e.g. ```json ... ```)
      const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
      const translations = JSON.parse(cleanJson);

      if (!Array.isArray(translations)) throw new Error('Not an array');
      
      return translations;
    } catch (e) {
      console.warn('Grok JSON parse failed, falling back to text split', content);
      // Fallback: split by newline if JSON fails
      return content.split('\n').filter(line => line.trim().length > 0);
    }
  }

  async translateSingle({ text, sourceLanguage, targetLanguage, model }) {
    if (!this.apiKey) {
      throw new Error('Grok API key not configured');
    }

    let validModel = model || 'grok-beta';
    if (validModel === 'grok-1') validModel = 'grok-beta';

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: validModel,
        messages: [
          {
            role: 'system',
            content: `Translate subtitle text from ${sourceLanguage || 'auto'} to ${targetLanguage}. Return only the translation.`
          },
          { role: 'user', content: text }
        ],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Grok API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  }
}

module.exports = GrokProvider;
