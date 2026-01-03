import { Outlet, useLocation } from 'react-router-dom';
import { MobileContainer } from './MobileContainer';
import { Navbar } from './Navbar';
import { TopBar } from './TopBar';
import { useUserPreferences } from '../../contexts/UserPreferencesContext';

export const Layout = () => {
    const location = useLocation();
    const isCompanionPage = location.pathname === '/companion';
    const { developerMode, spoofDb } = useUserPreferences();

    return (
        <MobileContainer>
            {developerMode && (
                <div className="bg-amber-100 text-amber-800 text-[10px] font-bold text-center py-1 border-b border-amber-200 shrink-0 z-50">
                    Developer Mode Active {spoofDb && "(Spoofing DB)"}
                </div>
            )}
            <div className="flex-1 overflow-y-auto pb-24 no-scrollbar">
                {!isCompanionPage && <TopBar />}
                <Outlet />
            </div>
            <Navbar />
        </MobileContainer>
    );
};
