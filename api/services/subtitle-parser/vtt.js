// api/services/subtitle-parser/vtt.js
class VTTParser {
  parse(content) {
    const subtitles = [];
    // Remove WEBVTT header and metadata
    const cleaned = content.replace(/^WEBVTT.*?\n\n/s, '');
    const blocks = cleaned.trim().split(/\n\s*\n/);

    for (const block of blocks) {
      const lines = block.trim().split('\n');
      if (lines.length < 2) continue;

      let cueId = null;
      let timelineIndex = 0;

      // Check for optional cue identifier
      if (!lines[0].includes('-->')) {
        cueId = lines[0];
        timelineIndex = 1;
      }

      const timelineMatch = lines[timelineIndex]?.match(
        /(\d{2}:\d{2}:\d{2}\.\d{3}|\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3}|\d{2}:\d{2}\.\d{3})/
      );

      if (!timelineMatch) continue;

      let startTime = this.normalizeTime(timelineMatch[1]);
      let endTime = this.normalizeTime(timelineMatch[2]);
      const text = lines.slice(timelineIndex + 1).join('\n').trim();

      if (text) {
        subtitles.push({
          id: cueId || subtitles.length + 1,
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

  normalizeTime(time) {
    if (time.split(':').length === 2) {
      return `00:${time}`;
    }
    return time;
  }

  stringify(subtitles, originalContent, preserveFormatting) {
    let output = 'WEBVTT\n\n';
    output += subtitles.map((sub, index) => {
      const startTime = sub.startTime.replace(',', '.');
      const endTime = sub.endTime.replace(',', '.');
      return `${index + 1}\n${startTime} --> ${endTime}\n${sub.text}`;
    }).join('\n\n');
    return output + '\n';
  }

  timeToMs(time) {
    const parts = time.split(':');
    const hours = parts.length === 3 ? parseInt(parts[0], 10) : 0;
    const minutes = parts.length === 3 ? parseInt(parts[1], 10) : parseInt(parts[0], 10);
    const [seconds, ms] = (parts.length === 3 ? parts[2] : parts[1]).split('.');
    return (
      hours * 3600000 +
      minutes * 60000 +
      parseInt(seconds, 10) * 1000 +
      parseInt(ms, 10)
    );
  }
}

module.exports = VTTParser;
