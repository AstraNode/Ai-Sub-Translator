// public/js/components/dropzone.js
export class Dropzone {
  constructor(element, input, onFile) {
    this.element = element;
    this.input = input;
    this.onFile = onFile;
    
    this.bindEvents();
  }

  bindEvents() {
    // Click to upload
    this.element.addEventListener('click', (e) => {
      if (e.target !== this.input) {
        this.input.click();
      }
    });

    // File input change
    this.input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.onFile(file);
      }
    });

    // Drag events
    this.element.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.element.classList.add('dropzone-active', 'border-primary-500', 'bg-primary-500/5');
    });

    this.element.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.element.classList.remove('dropzone-active', 'border-primary-500', 'bg-primary-500/5');
    });

    this.element.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.element.classList.remove('dropzone-active', 'border-primary-500', 'bg-primary-500/5');

      const file = e.dataTransfer.files[0];
      if (file) {
        this.onFile(file);
      }
    });

    // Prevent default drag behavior on window
    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', (e) => e.preventDefault());
  }
}
