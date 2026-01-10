import { Outlet, useLocation } from 'react-router-dom';
import { MobileContainer } from './MobileContainer';
import { Navbar } from './Navbar';
import { TopBar } from './TopBar';
import { useUserPreferences } from '../../contexts/UserPreferencesContext';
import { useConnection } from '../../contexts/ConnectionContext';

export const Layout = () => {
    const location = useLocation();
    const isCompanionPage = location.pathname === '/companion';
    const { developerMode, spoofDb } = useUserPreferences();
    const { isOnline, isApiConnected } = useConnection();

    return (
        <MobileContainer>
            {/* Notification bars - sticky at top */}
            {developerMode && (
                <div className="sticky top-0 bg-amber-100 text-amber-800 text-[10px] font-bold text-center py-1 border-b border-amber-200 z-50 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-800">
                    Developer Mode Active {spoofDb && "(Spoofing DB)"}
                </div>
            )}
            {!isOnline && (
                <div className="sticky top-0 bg-red-600 text-white text-xs font-semibold text-center py-2 border-b border-red-700 z-50">
                    ⚠️ No Internet Connection
                </div>
            )}
            {isOnline && !isApiConnected && (
                <div className="sticky top-0 bg-orange-600 text-white text-xs font-semibold text-center py-2 border-b border-orange-700 z-50">
                    ⚠️ Cannot Connect to Server - Check if backend is running
                </div>
            )}

            {/* TopBar - absolutely positioned for all pages */}
            <TopBar />

            {/* Content area - absolutely positioned with padding for TopBar and Navbar */}
            <div
                className="absolute inset-0 overflow-y-auto z-10 custom-scrollbar"
                style={{
                    paddingTop: '4.5rem', // TopBar height ~56px + 16px spacing (safe-area-top already in MobileContainer)
                    paddingBottom: isCompanionPage
                        ? 'calc(1.5rem + 4rem + 4px + 3.75rem + var(--safe-area-bottom, 0))' // Navbar + gap + 4px + chat input (~60px)
                        : 'calc(1.5rem + 4rem + var(--safe-area-bottom, 0))' // Navbar + gap
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
