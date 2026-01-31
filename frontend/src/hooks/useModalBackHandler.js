import { useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Hook to handle Android back button for modals.
 * Pushes history state when modal opens, closes modal on back.
 *
 * @param {boolean} isOpen - Whether the modal is open
 * @param {Function} onClose - Callback to close the modal
 * @param {string} modalId - Unique identifier for the modal
 * @returns {Function} handleClose - Wrapped close handler that manages history
 */
export const useModalBackHandler = (isOpen, onClose, modalId) => {
    const hasAddedState = useRef(false);

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        if (isOpen && !hasAddedState.current) {
            window.history.pushState({ modal: modalId }, '');
            hasAddedState.current = true;
        }

        const handlePopState = () => {
            if (isOpen) {
                onClose();
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => {
            window.removeEventListener('popstate', handlePopState);
            if (!isOpen) {
                hasAddedState.current = false;
            }
        };
    }, [isOpen, onClose, modalId]);

    // Return wrapped close handler that goes back in history
    const handleClose = useCallback(() => {
        if (Capacitor.isNativePlatform() && hasAddedState.current) {
            window.history.back();
            hasAddedState.current = false;
        } else {
            onClose();
        }
    }, [onClose]);

    return handleClose;
};
