// public/js/components/modal.js
export class Modal {
  constructor() {
    this.activeModal = null;
  }

  open(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.remove('hidden');
    this.activeModal = modal;
    document.body.style.overflow = 'hidden';
  }

  close() {
    if (this.activeModal) {
      this.activeModal.classList.add('hidden');
      this.activeModal = null;
      document.body.style.overflow = '';
    }
  }
}
