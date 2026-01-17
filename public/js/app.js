// public/js/app.js
import { ApiService } from './services/api.js';
import { StorageService } from './services/storage.js';
import { Dropzone } from './components/dropzone.js';
import { Editor } from './components/editor.js';
import { Toast } from './components/toast.js';
import { Modal } from './components/modal.js';
import { ProgressBar } from './components/progress.js';

class App {
  constructor() {
    this.api = new ApiService();
    this.storage = new StorageService();
    this.toast = new Toast();
    this.modal = new Modal();
    this.progressBar = new ProgressBar();
    
    this.state = {
      file: null,
      subtitles: [],
      translatedSubtitles: [],
      format: 'srt',
      originalContent: '',
      models: [],
      isTranslating: false,
      selectedModel: null,
      selectedProvider: null
    };

    this.init();
  }

  async init() {
    this.bindElements();
    this.bindEvents();
    this.initTheme();
    await this.loadModels();
    this.restoreState();
  }

  bindElements() {
    // Sections
    this.uploadSection = document.getElementById('uploadSection');
    this.editorSection = document.getElementById('editorSection');
    
    // Upload elements
    this.dropzone = document.getElementById('dropzone');
    this.fileInput = document.getElementById('fileInput');
    
    // Editor elements
    this.fileName = document.getElementById('fileName');
    this.fileInfo = document.getElementById('fileInfo');
    this.removeFile = document.getElementById('removeFile');
    this.sourceLanguage = document.getElementById('sourceLanguage');
    this.targetLanguage = document.getElementById('targetLanguage');
    this.aiModel = document.getElementById('aiModel');
    this.translateBtn = document.getElementById('translateBtn');
    this.downloadBtn = document.getElementById('downloadBtn');
    this.originalList = document.getElementById('originalList');
    this.translatedList = document.getElementById('translatedList');
    this.originalCount = document.getElementById('originalCount');
    this.translatedCount = document.getElementById('translatedCount');
    
    // Advanced options
    this.advancedToggle = document.getElementById('advancedToggle');
    this.advancedOptions = document.getElementById('advancedOptions');
    this.batchSize = document.getElementById('batchSize');
    this.outputFormat = document.getElementById('outputFormat');
    this.customInstructions = document.getElementById('customInstructions');
    
    // Progress elements
    this.progressContainer = document.getElementById('progressContainer');
    this.progressBar = document.getElementById('progressBar');
    this.progressText = document.getElementById('progressText');
    this.progressPercent = document.getElementById('progressPercent');
    
    // Theme toggle
    this.themeToggle = document.getElementById('themeToggle');
    
    // Modal elements
    this.editModal = document.getElementById('editModal');
    this.modalOverlay = document.getElementById('modalOverlay');
    this.closeModal = document.getElementById('closeModal');
    this.modalOriginalText = document.getElementById('modalOriginalText');
    this.modalTranslatedText = document.getElementById('modalTranslatedText');
    this.retranslateBtn = document.getElementById('retranslateBtn');
    this.saveEditBtn = document.getElementById('saveEditBtn');
  }

  bindEvents() {
    // Dropzone events
    const dropzoneHandler = new Dropzone(this.dropzone, this.fileInput, (file) => this.handleFileUpload(file));
    
    // File removal
    this.removeFile.addEventListener('click', () => this.resetEditor());
    
    // Translation
    this.translateBtn.addEventListener('click', () => this.handleTranslate());
    
    // Download
    this.downloadBtn.addEventListener('click', () => this.handleDownload());
    
    // Advanced options toggle
    this.advancedToggle.addEventListener('click', () => this.toggleAdvancedOptions());
    
    // Theme toggle
    this.themeToggle.addEventListener('click', () => this.toggleTheme());
    
    // Modal events
    this.modalOverlay.addEventListener('click', () => this.closeEditModal());
    this.closeModal.addEventListener('click', () => this.closeEditModal());
    this.saveEditBtn.addEventListener('click', () => this.saveEdit());
    this.retranslateBtn.addEventListener('click', () => this.retranslateSelected());
    
    // Model selection
    this.aiModel.addEventListener('change', (e) => this.handleModelChange(e));
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeEditModal();
      }
    });
  }

  initTheme() {
    const savedTheme = this.storage.get('theme') || 'dark';
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    this.updateThemeIcon(savedTheme);
  }

  toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    const theme = isDark ? 'dark' : 'light';
    this.storage.set('theme', theme);
    this.updateThemeIcon(theme);
  }

  updateThemeIcon(theme) {
    const sunIcon = this.themeToggle.querySelector('.sun-icon');
    const moonIcon = this.themeToggle.querySelector('.moon-icon');
    
    if (theme === 'dark') {
      sunIcon.classList.remove('hidden');
      moonIcon.classList.add('hidden');
    } else {
      sunIcon.classList.add('hidden');
      moonIcon.classList.remove('hidden');
    }
  }

  async loadModels() {
    try {
      const response = await this.api.getModels();
      this.state.models = response.models || [];
      this.populateModelDropdown();
    } catch (error) {
      console.error('Failed to load models:', error);
      this.toast.show('Failed to load AI models', 'error');
    }
  }

  populateModelDropdown() {
    this.aiModel.innerHTML = '';
    
    if (this.state.models.length === 0) {
      this.aiModel.innerHTML = '<option value="" disabled selected>No models available</option>';
      return;
    }

    // Group models by provider
    const providers = {};
    this.state.models.forEach(model => {
      if (!providers[model.provider]) {
        providers[model.provider] = [];
      }
      providers[model.provider].push(model);
    });

    // Create optgroups
    Object.entries(providers).forEach(([provider, models]) => {
      const optgroup = document.createElement('optgroup');
      optgroup.label = this.formatProviderName(provider);
      
      models.forEach(model => {
        const option = document.createElement('option');
        option.value = JSON.stringify({ id: model.id, provider: model.provider });
        option.textContent = model.name;
        option.title = model.description;
        optgroup.appendChild(option);
      });
      
      this.aiModel.appendChild(optgroup);
    });

    // Select first model by default
    if (this.aiModel.options.length > 0) {
      this.aiModel.selectedIndex = 0;
      this.handleModelChange({ target: this.aiModel });
    }
  }

  formatProviderName(provider) {
    const names = {
      openai: 'OpenAI',
      gemini: 'Google Gemini',
      grok: 'xAI Grok'
    };
    return names[provider] || provider;
  }

  handleModelChange(e) {
    try {
      const { id, provider } = JSON.parse(e.target.value);
      this.state.selectedModel = id;
      this.state.selectedProvider = provider;
    } catch (error) {
      console.error('Invalid model selection');
    }
  }

  async handleFileUpload(file) {
    try {
      this.toast.show('Uploading file...', 'info');
      
      const result = await this.api.uploadSubtitle(file);
      
      this.state.file = file;
      this.state.subtitles = result.subtitles;
      this.state.format = result.format;
      this.state.originalContent = result.originalContent;
      this.state.translatedSubtitles = [];
      
      this.showEditor();
      this.renderOriginalSubtitles();
      this.updateFileInfo(file.name, result.totalLines, result.format);
      
      this.toast.show('File uploaded successfully', 'success');
    } catch (error) {
      console.error('Upload error:', error);
      this.toast.show(error.message || 'Failed to upload file', 'error');
    }
  }

  showEditor() {
    this.uploadSection.classList.add('hidden');
    
    // CSS uses .active to display this section
    this.editorSection.classList.add('active');
    this.editorSection.classList.remove('hidden');
    this.editorSection.classList.add('animate-fade-in');
  }

  hideEditor() {
    // CSS uses .active to display this section
    this.editorSection.classList.remove('active');
    this.editorSection.classList.add('hidden');
    
    this.uploadSection.classList.remove('hidden');
  }

  updateFileInfo(name, lines, format) {
    this.fileName.textContent = name;
    this.fileInfo.textContent = `${lines} lines • ${format.toUpperCase()} format`;
    this.originalCount.textContent = `${lines} lines`;
  }

  renderOriginalSubtitles() {
    this.originalList.innerHTML = '';
    
    this.state.subtitles.forEach((sub, index) => {
      const item = this.createSubtitleItem(sub, index, 'original');
      this.originalList.appendChild(item);
    });
  }

  renderTranslatedSubtitles() {
    this.translatedList.innerHTML = '';
    
    if (this.state.translatedSubtitles.length === 0) {
      this.translatedList.innerHTML = `
        <div class="flex items-center justify-center h-48 text-dark-500">
          <p class="text-sm">Translations will appear here</p>
        </div>
      `;
      return;
    }
    
    this.state.translatedSubtitles.forEach((sub, index) => {
      const item = this.createSubtitleItem(sub, index, 'translated');
      this.translatedList.appendChild(item);
    });
    
    this.translatedCount.textContent = `${this.state.translatedSubtitles.length} lines`;
    this.downloadBtn.classList.remove('hidden');
  }

  createSubtitleItem(sub, index, type) {
    const div = document.createElement('div');
    div.className = `subtitle-item ${sub.error ? 'error' : ''}`;
    div.dataset.index = index;
    
    div.innerHTML = `
      <div class="flex items-start justify-between gap-2 mb-1">
        <span class="subtitle-index">#${sub.id || index + 1}</span>
        <span class="subtitle-time">${sub.startTime} → ${sub.endTime}</span>
      </div>
      <p class="subtitle-text">${this.escapeHtml(sub.text)}</p>
      ${sub.originalText && type === 'translated' ? `
        <p class="text-xs text-dark-600 mt-1 line-clamp-1">${this.escapeHtml(sub.originalText)}</p>
      ` : ''}
    `;
    
    if (type === 'translated') {
      div.addEventListener('click', () => this.openEditModal(index));
    }
    
    // Sync scrolling
    div.addEventListener('mouseenter', () => {
      const otherList = type === 'original' ? this.translatedList : this.originalList;
      const otherItem = otherList.querySelector(`[data-index="${index}"]`);
      if (otherItem) {
        otherItem.classList.add('bg-dark-800/30');
      }
    });
    
    div.addEventListener('mouseleave', () => {
      const otherList = type === 'original' ? this.translatedList : this.originalList;
      const otherItem = otherList.querySelector(`[data-index="${index}"]`);
      if (otherItem) {
        otherItem.classList.remove('bg-dark-800/30');
      }
    });
    
    return div;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  async handleTranslate() {
    if (this.state.isTranslating) return;
    if (!this.state.selectedModel || !this.state.selectedProvider) {
      this.toast.show('Please select an AI model', 'warning');
      return;
    }
    
    const targetLang = this.targetLanguage.value;
    if (!targetLang) {
      this.toast.show('Please select a target language', 'warning');
      return;
    }
    
    this.state.isTranslating = true;
    this.translateBtn.disabled = true;
    this.translateBtn.innerHTML = `
      <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span>Translating...</span>
    `;
    
    this.showProgress();
    
    try {
      const response = await this.api.translateSubtitles({
        subtitles: this.state.subtitles,
        sourceLanguage: this.sourceLanguage.value,
        targetLanguage: targetLang,
        model: this.state.selectedModel,
        provider: this.state.selectedProvider,
        batchSize: parseInt(this.batchSize.value) || 10,
        customInstructions: this.customInstructions.value
      }, (progress) => {
        this.updateProgress(progress);
      });
      
      this.state.translatedSubtitles = response.subtitles;
      this.renderTranslatedSubtitles();
      this.toast.show('Translation completed!', 'success');
      
    } catch (error) {
      console.error('Translation error:', error);
      this.toast.show(error.message || 'Translation failed', 'error');
    } finally {
      this.state.isTranslating = false;
      this.translateBtn.disabled = false;
      this.translateBtn.innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10"></path>
        </svg>
        <span>Translate</span>
      `;
      this.hideProgress();
    }
  }

  showProgress() {
    this.progressContainer.classList.add('active'); // Added .active
    this.progressContainer.classList.remove('hidden');
    this.progressContainer.classList.add('animate-fade-in');
  }

  hideProgress() {
    this.progressContainer.classList.remove('active'); // Removed .active
    this.progressContainer.classList.add('hidden');
  }

  updateProgress({ progress, completed, total }) {
    this.progressBar.style.width = `${progress}%`;
    this.progressPercent.textContent = `${progress}%`;
    this.progressText.textContent = `${completed} of ${total} lines completed`;
  }

  async handleDownload() {
    if (this.state.translatedSubtitles.length === 0) {
      this.toast.show('No translations to download', 'warning');
      return;
    }
    
    try {
      let format = this.outputFormat.value;
      if (format === 'same') {
        format = this.state.format;
      }
      
      const filename = this.state.file.name.replace(/\.[^/.]+$/, '') + '_translated';
      
      await this.api.downloadSubtitle({
        subtitles: this.state.translatedSubtitles,
        format,
        filename,
        originalContent: this.state.originalContent,
        preserveFormatting: true
      });
      
      this.toast.show('Download started', 'success');
    } catch (error) {
      console.error('Download error:', error);
      this.toast.show('Download failed', 'error');
    }
  }

  toggleAdvancedOptions() {
    const isHidden = this.advancedOptions.classList.toggle('hidden');
    const icon = this.advancedToggle.querySelector('svg');
    icon.style.transform = isHidden ? '' : 'rotate(180deg)';
  }

  openEditModal(index) {
    const sub = this.state.translatedSubtitles[index];
    if (!sub) return;
    
    this.currentEditIndex = index;
    this.modalOriginalText.textContent = sub.originalText || sub.text;
    this.modalTranslatedText.value = sub.text;
    
    // Fix: CSS uses .active for modal visibility
    this.editModal.classList.add('active');
    this.editModal.classList.remove('hidden');
    this.modalTranslatedText.focus();
  }

  closeEditModal() {
    // Fix: Remove .active
    this.editModal.classList.remove('active');
    this.editModal.classList.add('hidden');
    this.currentEditIndex = null;
  }

  saveEdit() {
    if (this.currentEditIndex === null) return;
    
    const newText = this.modalTranslatedText.value.trim();
    if (!newText) {
      this.toast.show('Translation cannot be empty', 'warning');
      return;
    }
    
    this.state.translatedSubtitles[this.currentEditIndex].text = newText;
    this.renderTranslatedSubtitles();
    this.closeEditModal();
    this.toast.show('Translation updated', 'success');
  }

  async retranslateSelected() {
    if (this.currentEditIndex === null) return;
    
    const sub = this.state.translatedSubtitles[this.currentEditIndex];
    if (!sub) return;
    
    this.retranslateBtn.disabled = true;
    this.retranslateBtn.innerHTML = `
      <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
      </svg>
      <span>Translating...</span>
    `;
    
    try {
      const result = await this.api.translateSingle({
        text: sub.originalText,
        sourceLanguage: this.sourceLanguage.value,
        targetLanguage: this.targetLanguage.value,
        model: this.state.selectedModel,
        provider: this.state.selectedProvider
      });
      
      this.modalTranslatedText.value = result.translated;
      this.toast.show('Re-translation completed', 'success');
    } catch (error) {
      console.error('Re-translation error:', error);
      this.toast.show('Re-translation failed', 'error');
    } finally {
      this.retranslateBtn.disabled = false;
      this.retranslateBtn.innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
        Re-translate
      `;
    }
  }

  resetEditor() {
    this.state = {
      ...this.state,
      file: null,
      subtitles: [],
      translatedSubtitles: [],
      format: 'srt',
      originalContent: ''
    };
    
    this.fileInput.value = '';
    this.originalList.innerHTML = '';
    this.translatedList.innerHTML = `
      <div class="flex items-center justify-center h-48 text-dark-500">
        <p class="text-sm">Translations will appear here</p>
      </div>
    `;
    this.downloadBtn.classList.add('hidden');
    this.hideProgress();
    this.hideEditor();
  }

  restoreState() {
    const savedTargetLang = this.storage.get('targetLanguage');
    if (savedTargetLang) {
      this.targetLanguage.value = savedTargetLang;
    }
    
    // Save target language on change
    this.targetLanguage.addEventListener('change', (e) => {
      this.storage.set('targetLanguage', e.target.value);
    });
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
