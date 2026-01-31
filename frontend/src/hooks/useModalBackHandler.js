import { useEffect, useLayoutEffect, useRef, useCallback } from 'react';
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

    // Use useLayoutEffect for pushing state - runs synchronously BEFORE browser paint
    // This ensures the history state is ready before user can press back button
    useLayoutEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        if (isOpen && !hasAddedState.current) {
            window.history.pushState({ modal: modalId }, '');
            hasAddedState.current = true;
        }
    }, [isOpen, modalId]);

    // Use regular useEffect for cleanup and event listener
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        // Reset ref when modal closes (handles programmatic close)
        if (!isOpen && hasAddedState.current) {
            hasAddedState.current = false;
        }

        const handlePopState = () => {
            if (isOpen) {
                hasAddedState.current = false;  // Reset before calling onClose
                onClose();
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [isOpen, onClose, modalId]);

    // Return wrapped close handler that goes back in history
    const handleClose = useCallback(() => {
        // Check actual history state, not just ref, to handle edge cases
        const hasModalState = window.history.state?.modal === modalId;
        if (Capacitor.isNativePlatform() && hasAddedState.current && hasModalState) {
            hasAddedState.current = false;
            window.history.back();
        } else {
            hasAddedState.current = false;
            onClose();
        }
    }, [onClose, modalId]);

    return handleClose;
};
