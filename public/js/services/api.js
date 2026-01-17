// public/js/services/api.js
export class ApiService {
  constructor() {
    this.baseUrl = '/api';
  }

  async getModels() {
    const response = await fetch(`${this.baseUrl}/models`);
    if (!response.ok) {
      throw new Error('Failed to fetch models');
    }
    return response.json();
  }

  async uploadSubtitle(file) {
    const formData = new FormData();
    formData.append('subtitle', file);

    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  }

  async translateSubtitles(options, onProgress) {
    const response = await fetch(`${this.baseUrl}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(options)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Translation failed');
    }

    // Handle SSE response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let result = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.substring(6));
            
            if (data.type === 'progress') {
              onProgress?.(data);
            } else if (data.type === 'complete') {
              result = data;
            } else if (data.type === 'error') {
              throw new Error(data.message);
            }
          } catch (e) {
            if (e.message !== 'Unexpected end of JSON input') {
              console.error('Parse error:', e);
            }
          }
        }
      }
    }

    if (!result) {
      throw new Error('No translation result received');
    }

    return result;
  }

  async translateSingle(options) {
    const response = await fetch(`${this.baseUrl}/translate/single`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(options)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Translation failed');
    }

    return response.json();
  }

  async downloadSubtitle(options) {
    const response = await fetch(`${this.baseUrl}/upload/download`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(options)
    });

    if (!response.ok) {
      throw new Error('Download failed');
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${options.filename}.${options.format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
