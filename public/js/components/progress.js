// public/js/components/progress.js
export class ProgressBar {
  constructor() {
    this.container = document.getElementById('progressContainer');
    this.bar = document.getElementById('progressBar');
    this.text = document.getElementById('progressText');
    this.percent = document.getElementById('progressPercent');
  }

  show() {
    this.container?.classList.remove('hidden');
  }

  hide() {
    this.container?.classList.add('hidden');
  }

  update(progress, completed, total) {
    if (this.bar) this.bar.style.width = `${progress}%`;
    if (this.percent) this.percent.textContent = `${progress}%`;
    if (this.text) this.text.textContent = `${completed} of ${total} lines completed`;
  }

  reset() {
    this.update(0, 0, 0);
  }
}
