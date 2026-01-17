// api/services/subtitle-parser/srt.js
class SRTParser {
  parse(content) {
    const subtitles = [];
    const blocks = content.trim().split(/\n\s*\n/);

    for (const block of blocks) {
      const lines = block.trim().split('\n');
      if (lines.length < 2) continue;

      let index = 0;
      let timelineIndex = 0;

      // Find the index line (number)
      if (/^\d+$/.test(lines[0].trim())) {
        index = parseInt(lines[0].trim(), 10);
        timelineIndex = 1;
      }

      // Find timeline
      const timelineMatch = lines[timelineIndex]?.match(
        /(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,\.]\d{3})/
      );

      if (!timelineMatch) continue;

      const startTime = timelineMatch[1].replace('.', ',');
      const endTime = timelineMatch[2].replace('.', ',');
      const text = lines.slice(timelineIndex + 1).join('\n').trim();

      if (text) {
        subtitles.push({
          id: index || subtitles.length + 1,
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

  stringify(subtitles, originalContent, preserveFormatting) {
    return subtitles.map((sub, index) => {
      return `${index + 1}\n${sub.startTime} --> ${sub.endTime}\n${sub.text}`;
    }).join('\n\n') + '\n';
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
}

module.exports = SRTParser;
