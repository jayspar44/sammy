import { useRef, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

const PAGE_ORDER = ['/', '/companion', '/insights'];

/**
 * Hook to enable swipe navigation between main pages.
 * Swipe left to go to next page, swipe right to go to previous page.
 *
 * @param {boolean} enabled - Whether swipe navigation is enabled
 * @returns {{ active: boolean, direction: 'left' | 'right' | null }} Swipe state for visual feedback
 */
export const useSwipeNavigation = (enabled) => {
    const navigate = useNavigate();
    const location = useLocation();
    const touchStart = useRef({ x: 0, y: 0 });
    const [swipeState, setSwipeState] = useState({ active: false, direction: null });

    useEffect(() => {
        if (!enabled || !Capacitor.isNativePlatform()) {
            return;
        }

        const minSwipeDistance = 80;
        const maxVerticalDistance = 100; // Prevent diagonal swipes

        const handleTouchStart = (e) => {
            touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            setSwipeState({ active: false, direction: null });
        };

        const handleTouchMove = (e) => {
            const deltaX = touchStart.current.x - e.touches[0].clientX;
            const deltaY = Math.abs(touchStart.current.y - e.touches[0].clientY);

            // Only show glow for horizontal swipes
            if (deltaY < maxVerticalDistance && Math.abs(deltaX) > 30) {
                const currentIndex = PAGE_ORDER.indexOf(location.pathname);
                // Only show if there's a page in that direction
                const canGoLeft = deltaX > 0 && currentIndex < PAGE_ORDER.length - 1;
                const canGoRight = deltaX < 0 && currentIndex > 0;

                if (canGoLeft) {
                    setSwipeState({ active: true, direction: 'left' });
                } else if (canGoRight) {
                    setSwipeState({ active: true, direction: 'right' });
                } else {
                    setSwipeState({ active: false, direction: null });
                }
            } else {
                setSwipeState({ active: false, direction: null });
            }
        };

        const handleTouchEnd = (e) => {
            const deltaX = touchStart.current.x - e.changedTouches[0].clientX;
            const deltaY = Math.abs(touchStart.current.y - e.changedTouches[0].clientY);

            setSwipeState({ active: false, direction: null });

            if (deltaY > maxVerticalDistance) return; // Vertical scroll, ignore

            // Don't navigate if a modal is open (has history state with modal)
            if (window.history.state?.modal) return;

            const currentIndex = PAGE_ORDER.indexOf(location.pathname);
            if (currentIndex === -1) return;

            if (deltaX > minSwipeDistance && currentIndex < PAGE_ORDER.length - 1) {
                // Swipe left -> next page
                navigate(PAGE_ORDER[currentIndex + 1]);
            } else if (deltaX < -minSwipeDistance && currentIndex > 0) {
                // Swipe right -> previous page
                navigate(PAGE_ORDER[currentIndex - 1]);
            }
        };

        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchmove', handleTouchMove, { passive: true });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [enabled, navigate, location.pathname]);

    return swipeState;
};
