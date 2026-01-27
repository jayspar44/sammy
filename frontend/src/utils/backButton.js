import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

let backButtonListener = null;

export function setupBackButtonHandler(getCurrentPath) {
  if (!Capacitor.isNativePlatform()) return;

  backButtonListener = App.addListener('backButton', () => {
    const currentPath = getCurrentPath();

    if (currentPath === '/' || currentPath === '') {
      // On home page - exit the app
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
