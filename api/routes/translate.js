// api/routes/translate.js
const express = require('express');
const router = express.Router();
const AIProviders = require('../services/ai-providers');

// Translate subtitles
router.post('/', async (req, res) => {
  try {
    const {
      subtitles,
      sourceLanguage,
      targetLanguage,
      model,
      provider,
      batchSize = 10,
      preserveTiming = true,
      customInstructions = ''
    } = req.body;

    if (!subtitles || !targetLanguage || !model || !provider) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const aiProvider = AIProviders.getProvider(provider);
    if (!aiProvider) {
      return res.status(400).json({ error: `Unsupported provider: ${provider}` });
    }

    // Set up SSE for progress updates
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const translated = [];
    const batches = [];

    // Create batches
    for (let i = 0; i < subtitles.length; i += batchSize) {
      batches.push(subtitles.slice(i, i + batchSize));
    }

    let completedBatches = 0;

    for (const batch of batches) {
      try {
        const translatedBatch = await aiProvider.translateBatch({
          texts: batch.map(s => s.text),
          sourceLanguage,
          targetLanguage,
          model,
          customInstructions
        });

        // Map translations back to subtitle objects
        batch.forEach((subtitle, index) => {
          translated.push({
            ...subtitle,
            originalText: subtitle.text,
            text: translatedBatch[index] || subtitle.text
          });
        });

        completedBatches++;
        const progress = Math.round((completedBatches / batches.length) * 100);

        // Send progress update
        res.write(`data: ${JSON.stringify({
          type: 'progress',
          progress,
          completed: translated.length,
          total: subtitles.length
        })}\n\n`);

      } catch (batchError) {
        console.error('Batch translation error:', batchError);
        // Keep original text for failed translations
        batch.forEach(subtitle => {
          translated.push({
            ...subtitle,
            originalText: subtitle.text,
            error: true
          });
        });
      }
    }

    // Send completion event
    res.write(`data: ${JSON.stringify({
      type: 'complete',
      subtitles: translated
    })}\n\n`);

    res.end();
  } catch (error) {
    console.error('Translation error:', error);
    res.write(`data: ${JSON.stringify({
      type: 'error',
      message: error.message
    })}\n\n`);
    res.end();
  }
});

// Single text translation for manual edits
router.post('/single', async (req, res) => {
  try {
    const { text, sourceLanguage, targetLanguage, model, provider } = req.body;

    if (!text || !targetLanguage || !model || !provider) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const aiProvider = AIProviders.getProvider(provider);
    if (!aiProvider) {
      return res.status(400).json({ error: `Unsupported provider: ${provider}` });
    }

    const translated = await aiProvider.translateSingle({
      text,
      sourceLanguage,
      targetLanguage,
      model
    });

    res.json({ translated });
  } catch (error) {
    console.error('Single translation error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
