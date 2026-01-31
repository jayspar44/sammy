import { Outlet, useLocation } from 'react-router-dom';
import { MobileContainer } from './MobileContainer';
import { Navbar } from './Navbar';
import { TopBar } from './TopBar';
import { useUserPreferences } from '../../contexts/UserPreferencesContext';
import { useConnection } from '../../contexts/ConnectionContext';
import { useSwipeNavigation } from '../../hooks/useSwipeNavigation';

export const Layout = () => {
    const location = useLocation();
    const isCompanionPage = location.pathname === '/companion';
    const { developerMode, spoofDb, swipeNavigationEnabled } = useUserPreferences();
    const { isOnline, isApiConnected } = useConnection();

    // Enable swipe navigation between main pages
    useSwipeNavigation(swipeNavigationEnabled);

    return (
        <MobileContainer>
            {/* Notification bars - sticky at top, accounting for safe area */}
            {developerMode && (
                <div
                    className="sticky bg-amber-100 text-amber-800 text-[10px] font-bold text-center py-1 border-b border-amber-200 z-50 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-800"
                    style={{ top: 'var(--safe-area-top, 0px)' }}
                >
                    Developer Mode Active {spoofDb && "(Spoofing DB)"}
                </div>
            )}
            {!isOnline && (
                <div
                    className="sticky bg-red-600 text-white text-xs font-semibold text-center py-2 border-b border-red-700 z-50"
                    style={{ top: 'var(--safe-area-top, 0px)' }}
                >
                    ⚠️ No Internet Connection
                </div>
            )}
            {isOnline && !isApiConnected && (
                <div
                    className="sticky bg-orange-600 text-white text-xs font-semibold text-center py-2 border-b border-orange-700 z-50"
                    style={{ top: 'var(--safe-area-top, 0px)' }}
                >
                    ⚠️ Cannot Connect to Server - Check if backend is running
                </div>
            )}

            {/* TopBar - absolutely positioned for all pages */}
            <TopBar />

            {/* Content area - absolutely positioned with padding for TopBar and Navbar */}
            <div
                className="absolute inset-0 overflow-y-auto z-10 custom-scrollbar"
                style={{
                    paddingTop: 'calc(var(--safe-area-top, 0px) + 4.5rem)', // Safe area + TopBar height
                    paddingBottom: isCompanionPage
                        ? 'calc(1.5rem + 4rem + 4px + 3.75rem + var(--safe-area-bottom, 0px))' // Navbar + gap + 4px + chat input (~60px)
                        : 'calc(1.5rem + 4rem + var(--safe-area-bottom, 0px))' // Navbar + gap
                }}
            >
                <Outlet />
            </div>

            {/* Portal target for Companion chat input - rendered outside scroll area */}
            <div id="companion-chat-portal" />

            {/* Navbar - absolutely positioned */}
            <Navbar />
        </MobileContainer>
    );
};
