// api/services/subtitle-parser/ass.js
class ASSParser {
  parse(content) {
    const subtitles = [];
    const lines = content.split('\n');
    let inEvents = false;
    let formatLine = null;
    let textIndex = -1;
    let startIndex = -1;
    let endIndex = -1;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed === '[Events]') {
        inEvents = true;
        continue;
      }

      if (trimmed.startsWith('[') && trimmed !== '[Events]') {
        inEvents = false;
        continue;
      }

      if (inEvents) {
        if (trimmed.startsWith('Format:')) {
          formatLine = trimmed.substring(7).split(',').map(s => s.trim().toLowerCase());
          textIndex = formatLine.indexOf('text');
          startIndex = formatLine.indexOf('start');
          endIndex = formatLine.indexOf('end');
          continue;
        }

        if (trimmed.startsWith('Dialogue:')) {
          const dialogueContent = trimmed.substring(9);
          const parts = this.splitDialogueLine(dialogueContent, formatLine?.length || 10);

          if (parts.length > textIndex && textIndex !== -1) {
            const startTime = parts[startIndex] || '0:00:00.00';
            const endTime = parts[endIndex] || '0:00:00.00';
            const text = parts.slice(textIndex).join(',').trim();

            subtitles.push({
              id: subtitles.length + 1,
              startTime: this.formatTime(startTime),
              endTime: this.formatTime(endTime),
              startMs: this.timeToMs(startTime),
              endMs: this.timeToMs(endTime),
              text: this.cleanText(text),
              rawText: text,
              assStyle: parts.slice(0, textIndex)
            });
          }
        }
      }
    }

    return subtitles;
  }

  splitDialogueLine(line, fieldCount) {
    const parts = [];
    let current = '';
    let count = 0;

    for (let i = 0; i < line.length; i++) {
      if (line[i] === ',' && count < fieldCount - 1) {
        parts.push(current.trim());
        current = '';
        count++;
      } else {
        current += line[i];
      }
    }
    parts.push(current.trim());

    return parts;
  }

  cleanText(text) {
    // Remove ASS style tags but preserve the actual text
    return text
      .replace(/\{[^}]*\}/g, '') // Remove {...} style tags
      .replace(/\\N/g, '\n')     // Convert line breaks
      .replace(/\\n/g, '\n')
      .replace(/\\h/g, ' ')      // Hard space
      .trim();
  }

  formatTime(time) {
    // Convert ASS time (H:MM:SS.CC) to SRT-like format (HH:MM:SS,mmm)
    const match = time.match(/(\d+):(\d{2}):(\d{2})\.(\d{2})/);
    if (!match) return time;

    const hours = match[1].padStart(2, '0');
    const minutes = match[2];
    const seconds = match[3];
    const centiseconds = match[4];
    const milliseconds = (parseInt(centiseconds, 10) * 10).toString().padStart(3, '0');

    return `${hours}:${minutes}:${seconds},${milliseconds}`;
  }

  timeToMs(time) {
    const match = time.match(/(\d+):(\d{2}):(\d{2})\.(\d{2})/);
    if (!match) return 0;

    return (
      parseInt(match[1], 10) * 3600000 +
      parseInt(match[2], 10) * 60000 +
      parseInt(match[3], 10) * 1000 +
      parseInt(match[4], 10) * 10
    );
  }

  stringify(subtitles, originalContent, preserveFormatting) {
    if (!preserveFormatting || !originalContent) {
      // Generate minimal ASS output
      return this.generateMinimalASS(subtitles);
    }

    // Preserve original ASS structure, only replace dialogue text
    const lines = originalContent.split('\n');
    const result = [];
    let subtitleIndex = 0;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('Dialogue:') && subtitleIndex < subtitles.length) {
        const sub = subtitles[subtitleIndex];
        if (sub.assStyle && sub.rawText) {
          // Reconstruct dialogue line with translated text
          const newText = sub.text.replace(/\n/g, '\\N');
          const stylePart = sub.assStyle.join(',');
          result.push(`Dialogue: ${stylePart},${newText}`);
        } else {
          result.push(line);
        }
        subtitleIndex++;
      } else {
        result.push(line);
      }
    }

    return result.join('\n');
  }

  generateMinimalASS(subtitles) {
    let output = `[Script Info]
Title: Translated Subtitles
ScriptType: v4.00+
WrapStyle: 0
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,48,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2,1,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

    for (const sub of subtitles) {
      const start = this.msToASSTime(sub.startMs);
      const end = this.msToASSTime(sub.endMs);
      const text = sub.text.replace(/\n/g, '\\N');
      output += `Dialogue: 0,${start},${end},Default,,0,0,0,,${text}\n`;
    }

    return output;
  }

  msToASSTime(ms) {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);

    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  }
}

module.exports = ASSParser;
