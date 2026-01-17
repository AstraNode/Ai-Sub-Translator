// api/services/subtitle-parser/index.js
const SRTParser = require('./srt');
const VTTParser = require('./vtt');
const ASSParser = require('./ass');
const SUBParser = require('./sub');

class SubtitleParser {
  constructor() {
    this.parsers = {
      '.srt': new SRTParser(),
      '.vtt': new VTTParser(),
      '.ass': new ASSParser(),
      '.ssa': new ASSParser(),
      '.sub': new SUBParser(),
      '.sbv': new SUBParser(),
      '.txt': new SRTParser() // Assume SRT for txt
    };
  }

  parse(content, format) {
    const parser = this.parsers[format.toLowerCase()];
    if (!parser) {
      throw new Error(`Unsupported format: ${format}`);
    }
    return parser.parse(content);
  }

  stringify(subtitles, format, originalContent, preserveFormatting = true) {
    const parser = this.parsers[`.${format.toLowerCase()}`];
    if (!parser) {
      throw new Error(`Unsupported format: ${format}`);
    }
    return parser.stringify(subtitles, originalContent, preserveFormatting);
  }
}

module.exports = SubtitleParser;
