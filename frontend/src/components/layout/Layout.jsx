import { Outlet } from 'react-router-dom';
import { MobileContainer } from './MobileContainer';
import { Navbar } from './Navbar';

export const Layout = () => {
    return (
        <MobileContainer>
            <div className="flex-1 overflow-y-auto pb-24 no-scrollbar">
                <Outlet />
            </div>
            <Navbar />
        </MobileContainer>
    );
};
