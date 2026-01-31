import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

let keyboardListeners = [];

/**
 * Checks if there's an active input element that should keep the keyboard open
 */
const hasActiveInput = () => {
  const activeElement = document.activeElement;
  if (!activeElement) return false;

  const inputTypes = ['INPUT', 'TEXTAREA'];
  const isInputElement = inputTypes.includes(activeElement.tagName);
  const isContentEditable = activeElement.isContentEditable;

  return isInputElement || isContentEditable;
};

/**
 * Resets keyboard state if no input is focused
 */
const resetKeyboardStateIfNeeded = () => {
  if (!hasActiveInput()) {
    // No input focused, hide keyboard and reset CSS
    document.documentElement.style.setProperty('--keyboard-height', '0px');
    document.body.classList.remove('keyboard-visible');
    // Also try to hide the keyboard in case it's somehow still visible
    Keyboard.hide().catch(() => {
      // Ignore errors - keyboard might already be hidden
    });
  }
};

export const setupKeyboardListeners = () => {
  // Only run on native platforms
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  // Set resize mode to native
  Keyboard.setResizeMode({ mode: 'native' }).catch(err => {
    console.warn('Could not set keyboard resize mode:', err);
  });

  // Keyboard will show listener
  const showListener = Keyboard.addListener('keyboardWillShow', (info) => {
    // Set keyboard height as CSS variable
    const keyboardHeight = info.keyboardHeight || 0;
    document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
    document.body.classList.add('keyboard-visible');
  });

  // Keyboard will hide listener
  const hideListener = Keyboard.addListener('keyboardWillHide', () => {
    // Reset keyboard height
    document.documentElement.style.setProperty('--keyboard-height', '0px');
    document.body.classList.remove('keyboard-visible');
  });

  // App resume listener - reset keyboard state if no input is focused
  // This handles the case where the app is reopened with keyboard space reserved but no active input
  const resumeListener = App.addListener('appStateChange', ({ isActive }) => {
    if (isActive) {
      // Small delay to let the app fully resume before checking
      setTimeout(resetKeyboardStateIfNeeded, 100);
    }
  });

  keyboardListeners.push(showListener, hideListener, resumeListener);

  return () => {
    keyboardListeners.forEach(listener => listener.remove());
    keyboardListeners = [];
  };
};
