import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

let backButtonListener = null;

export function setupBackButtonHandler(getCurrentPath) {
  if (!Capacitor.isNativePlatform()) return;

  backButtonListener = App.addListener('backButton', () => {
    const currentPath = getCurrentPath();

    // Check if there's a modal state in history (pushed by useModalBackHandler)
    // If so, go back in history (which will trigger popstate and close modal)
    const hasModalState = window.history.state?.modal;

    if (hasModalState) {
      // Modal is open - go back to close it
      window.history.back();
    } else if (currentPath === '/' || currentPath === '') {
      // On home page with no modal - exit the app
      App.exitApp();
    } else {
      // On other pages - go back in history
      window.history.back();
    }
  });
}

export function removeBackButtonHandler() {
  if (backButtonListener) {
    backButtonListener.remove();
    backButtonListener = null;
  }
}
