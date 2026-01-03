import { Outlet, useLocation } from 'react-router-dom';
import { MobileContainer } from './MobileContainer';
import { Navbar } from './Navbar';
import { TopBar } from './TopBar';

export const Layout = () => {
    const location = useLocation();
    const isCompanionPage = location.pathname === '/companion';

    return (
        <MobileContainer>
            <div className="flex-1 overflow-y-auto pb-24 no-scrollbar">
                {!isCompanionPage && <TopBar />}
                <Outlet />
            </div>
            <Navbar />
        </MobileContainer>
    );
};
