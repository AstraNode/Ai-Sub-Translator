// public/js/components/editor.js
export class Editor {
  constructor(originalContainer, translatedContainer) {
    this.originalContainer = originalContainer;
    this.translatedContainer = translatedContainer;
    this.syncScroll = true;
    
    this.bindScrollSync();
  }

  bindScrollSync() {
    if (!this.originalContainer || !this.translatedContainer) return;

    let isSyncing = false;

    const syncScroll = (source, target) => {
      if (isSyncing || !this.syncScroll) return;
      isSyncing = true;
      
      const scrollRatio = source.scrollTop / (source.scrollHeight - source.clientHeight);
      target.scrollTop = scrollRatio * (target.scrollHeight - target.clientHeight);
      
      requestAnimationFrame(() => {
        isSyncing = false;
      });
    };

    this.originalContainer.addEventListener('scroll', () => {
      syncScroll(this.originalContainer, this.translatedContainer);
    });

    this.translatedContainer.addEventListener('scroll', () => {
      syncScroll(this.translatedContainer, this.originalContainer);
    });
  }

  toggleSyncScroll(enabled) {
    this.syncScroll = enabled;
  }
}
