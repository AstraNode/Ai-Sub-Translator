// api/routes/models.js
const express = require('express');
const router = express.Router();

// Get available AI models based on configured API keys
router.get('/', (req, res) => {
  const models = [];

  // OpenAI Models
  if (process.env.OPENAI_API_KEY) {
    models.push(
      {
        id: 'gpt-4-turbo-preview',
        name: 'GPT-4 Turbo',
        provider: 'openai',
        description: 'Most capable GPT-4 model'
      },
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        provider: 'openai',
        description: 'Optimized GPT-4 for faster responses'
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        provider: 'openai',
        description: 'Smaller, faster GPT-4o variant'
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: 'openai',
        description: 'Fast and cost-effective'
      }
    );
  }

  // Gemini Models
  if (process.env.GEMINI_API_KEY) {
    models.push(
      {
       id: 'gemini-2.0-flash-exp',
       name: 'Gemini 2.0 Flash (Experimental)',
       provider: 'gemini',
       description: 'Newest, Fastest, Free',
       contextWindow: 1000000
      },
      {
       id: 'gemini-1.5-flash',
       name: 'Gemini 1.5 Flash',
       provider: 'gemini',
       description: 'Stable, Fast, Free Tier',
       contextWindow: 1000000
      },
      {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        provider: 'gemini',
        description: 'Best for text generation'
      }
    );
  }

  // Grok Models
  if (process.env.GROK_API_KEY) {
    models.push(
      {
        id: 'grok-2',
        name: 'Grok 2',
        provider: 'grok',
        description: 'Latest Grok model by xAI'
      },
      {
        id: 'grok-1',
        name: 'Grok 1',
        provider: 'grok',
        description: 'Original Grok model'
      }
    );
  }

  res.json({
    models,
    hasOpenAI: !!process.env.OPENAI_API_KEY,
    hasGemini: !!process.env.GEMINI_API_KEY,
    hasGrok: !!process.env.GROK_API_KEY
  });
});

module.exports = router;
