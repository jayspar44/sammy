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
            {developerMode && (
                <div className="bg-amber-100 text-amber-800 text-[10px] font-bold text-center py-1 border-b border-amber-200 shrink-0 z-50 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-800">
                    Developer Mode Active {spoofDb && "(Spoofing DB)"}
                </div>
            )}
            {!isOnline && (
                <div className="bg-red-600 text-white text-xs font-semibold text-center py-2 border-b border-red-700 shrink-0 z-50">
                    ⚠️ No Internet Connection
                </div>
            )}
            {isOnline && !isApiConnected && (
                <div className="bg-orange-600 text-white text-xs font-semibold text-center py-2 border-b border-orange-700 shrink-0 z-50">
                    ⚠️ Cannot Connect to Server - Check if backend is running
                </div>
            )}
            <div className="flex-1 overflow-y-auto no-scrollbar" style={{ paddingBottom: 'calc(4rem + var(--safe-area-bottom))' }}>
                {!isCompanionPage && <TopBar />}
                <Outlet />
            </div>
            <Navbar />
        </MobileContainer>
    );
};
