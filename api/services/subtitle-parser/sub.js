// api/services/subtitle-parser/sub.js
class SUBParser {
  parse(content) {
    const subtitles = [];
    const lines = content.trim().split('\n');

    // Try to detect format (MicroDVD or SubViewer)
    if (lines[0]?.match(/^\{\d+\}\{\d+\}/)) {
      return this.parseMicroDVD(lines);
    } else if (content.includes('[INFORMATION]') || lines.some(l => l.match(/^\d{2}:\d{2}:\d{2}\.\d{2},\d{2}:\d{2}:\d{2}\.\d{2}/))) {
      return this.parseSubViewer(content);
    } else {
      // Try SBV (YouTube) format
      return this.parseSBV(content);
    }
  }

  parseMicroDVD(lines) {
    const subtitles = [];
    const fps = 23.976; // Default FPS

    for (const line of lines) {
      const match = line.match(/^\{(\d+)\}\{(\d+)\}(.+)$/);
      if (match) {
        const startFrame = parseInt(match[1], 10);
        const endFrame = parseInt(match[2], 10);
        const text = match[3].replace(/\|/g, '\n');

        const startMs = Math.round((startFrame / fps) * 1000);
        const endMs = Math.round((endFrame / fps) * 1000);

        subtitles.push({
          id: subtitles.length + 1,
          startTime: this.msToTime(startMs),
          endTime: this.msToTime(endMs),
          startMs,
          endMs,
          text,
          startFrame,
          endFrame
        });
      }
    }

    return subtitles;
  }

  parseSubViewer(content) {
    const subtitles = [];
    const blocks = content.split(/\n\s*\n/);

    for (const block of blocks) {
      const lines = block.trim().split('\n');
      const timeMatch = lines[0]?.match(/(\d{2}:\d{2}:\d{2}\.\d{2}),(\d{2}:\d{2}:\d{2}\.\d{2})/);

      if (timeMatch) {
        const startTime = timeMatch[1];
        const endTime = timeMatch[2];
        const text = lines.slice(1).join('\n').replace(/\[br\]/gi, '\n');

        subtitles.push({
          id: subtitles.length + 1,
          startTime: startTime.replace('.', ',') + '0',
          endTime: endTime.replace('.', ',') + '0',
          startMs: this.subViewerTimeToMs(startTime),
          endMs: this.subViewerTimeToMs(endTime),
          text
        });
      }
    }

    return subtitles;
  }

  parseSBV(content) {
    const subtitles = [];
    const blocks = content.trim().split(/\n\s*\n/);

    for (const block of blocks) {
      const lines = block.trim().split('\n');
      const timeMatch = lines[0]?.match(/(\d+:\d{2}:\d{2}\.\d{3}),(\d+:\d{2}:\d{2}\.\d{3})/);

      if (timeMatch) {
        const startTime = this.normalizeSBVTime(timeMatch[1]);
        const endTime = this.normalizeSBVTime(timeMatch[2]);
        const text = lines.slice(1).join('\n');

        subtitles.push({
          id: subtitles.length + 1,
          startTime,
          endTime,
          startMs: this.timeToMs(startTime),
          endMs: this.timeToMs(endTime),
          text
        });
      }
    }

    return subtitles;
  }

  normalizeSBVTime(time) {
    const parts = time.split(':');
    if (parts.length === 3) {
      const hours = parts[0].padStart(2, '0');
      const [seconds, ms] = parts[2].split('.');
      return `${hours}:${parts[1]}:${seconds},${ms}`;
    }
    return time;
  }

  subViewerTimeToMs(time) {
    const [hours, minutes, rest] = time.split(':');
    const [seconds, cs] = rest.split('.');
    return (
      parseInt(hours, 10) * 3600000 +
      parseInt(minutes, 10) * 60000 +
      parseInt(seconds, 10) * 1000 +
      parseInt(cs, 10) * 10
    );
  }

  timeToMs(time) {
    const [hours, minutes, rest] = time.split(':');
    const [seconds, ms] = rest.split(',');
    return (
      parseInt(hours, 10) * 3600000 +
      parseInt(minutes, 10) * 60000 +
      parseInt(seconds, 10) * 1000 +
      parseInt(ms, 10)
    );
  }

  msToTime(ms) {
    const hours = Math.floor(ms / 3600000).toString().padStart(2, '0');
    const minutes = Math.floor((ms % 3600000) / 60000).toString().padStart(2, '0');
    const seconds = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
    const milliseconds = (ms % 1000).toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds},${milliseconds}`;
  }

  stringify(subtitles, originalContent, preserveFormatting) {
    // Default to SRT format for SUB files
    return subtitles.map((sub, index) => {
      return `${index + 1}\n${sub.startTime} --> ${sub.endTime}\n${sub.text}`;
    }).join('\n\n') + '\n';
  }
}

module.exports = SUBParser;
