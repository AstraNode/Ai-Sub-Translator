// api/routes/upload.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const SubtitleParser = require('../services/subtitle-parser');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.srt', '.vtt', '.ass', '.ssa', '.sub', '.sbv', '.txt'];
    const ext = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file format: ${ext}`));
    }
  }
});

// Upload and parse subtitle file
router.post('/', upload.single('subtitle'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const content = req.file.buffer.toString('utf-8');
    const filename = req.file.originalname;
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));

    const parser = new SubtitleParser();
    const parsed = parser.parse(content, ext);

    res.json({
      id: uuidv4(),
      filename,
      format: ext.replace('.', ''),
      subtitles: parsed,
      totalLines: parsed.length,
      originalContent: content
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Download translated subtitle
router.post('/download', async (req, res) => {
  try {
    const { subtitles, format, filename, originalContent, preserveFormatting } = req.body;

    if (!subtitles || !format) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const parser = new SubtitleParser();
    const output = parser.stringify(subtitles, format, originalContent, preserveFormatting);

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename || 'translated'}.${format}"`);
    res.send(output);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
