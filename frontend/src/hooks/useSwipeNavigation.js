import { useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

const PAGE_ORDER = ['/', '/companion', '/insights'];

/**
 * Hook to enable swipe navigation between main pages.
 * Swipe left to go to next page, swipe right to go to previous page.
 *
 * @param {boolean} enabled - Whether swipe navigation is enabled
 */
export const useSwipeNavigation = (enabled) => {
    const navigate = useNavigate();
    const location = useLocation();
    const touchStart = useRef({ x: 0, y: 0 });
    const touchEnd = useRef({ x: 0, y: 0 });

    useEffect(() => {
        if (!enabled || !Capacitor.isNativePlatform()) return;

        const minSwipeDistance = 80;
        const maxVerticalDistance = 100; // Prevent diagonal swipes

        const handleTouchStart = (e) => {
            touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        };

        const handleTouchEnd = (e) => {
            touchEnd.current = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
            const deltaX = touchStart.current.x - touchEnd.current.x;
            const deltaY = Math.abs(touchStart.current.y - touchEnd.current.y);

            if (deltaY > maxVerticalDistance) return; // Vertical scroll, ignore

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
        document.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [enabled, navigate, location.pathname]);
};
