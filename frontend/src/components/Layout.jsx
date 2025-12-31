import React, { useState, useRef } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, MessageCircle, TrendingUp } from 'lucide-react';
import { cn } from '../utils/cn';
import { TopBar } from './layout/TopBar';
import { useUserPreferences } from '../contexts/UserPreferencesContext';

export default function Layout() {
    const { developerMode, spoofDb } = useUserPreferences();
    const location = useLocation();
    const isCompanionPage = location.pathname === '/companion';

    const [isNavVisible, setIsNavVisible] = useState(true);
    const lastScrollY = useRef(0);
    const scrollRef = useRef(null);

    const handleScroll = (e) => {
        const currentScrollY = e.currentTarget.scrollTop;
        if (currentScrollY > lastScrollY.current && currentScrollY > 20) {
            // Scrolling Down -> Hide
            setIsNavVisible(false);
        } else {
            // Scrolling Up -> Show
            setIsNavVisible(true);
        }
        lastScrollY.current = currentScrollY;
    };

    return (
        // Global Wrapper: Centered container simulating mobile screen
        <div className="min-h-screen bg-neutral-50 flex justify-center font-sans text-slate-500">
            {/* Mobile Frame */}
            <div className="w-full max-w-[420px] bg-surface min-h-screen relative shadow-2xl flex flex-col overflow-hidden">

                {/* Scroll Area */}
                <div
                    className="flex-1 overflow-y-auto scrollbar-hide pb-24"
                    onScroll={handleScroll}
                    ref={scrollRef}
                >
                    {developerMode && (
                        <div className="bg-amber-100 text-amber-800 text-xs font-bold text-center py-1 border-b border-amber-200">
                            Developer Mode Active {spoofDb && "(Spoofing DB)"}
                        </div>
                    )}
                    {!isCompanionPage && <TopBar />}
                    <Outlet />
                </div>

                {/* Sticky Bottom Navigation */}
                <nav className={cn(
                    "absolute bottom-4 left-4 right-4 bg-surface/90 backdrop-blur-lg border border-slate-200/60 rounded-2xl shadow-lg pb-2 pt-2 z-50 transition-transform duration-300 ease-in-out",
                    isNavVisible ? "translate-y-0" : "translate-y-[150%]"
                )}>
                    <div className="flex justify-around items-center px-2 py-1">
                        <NavLink to="/" className={({ isActive }) => cn("flex flex-col items-center gap-1 p-2 transition-colors", isActive ? "text-primary stroke-[2.5px]" : "text-slate-400 stroke-[2px]")}>
                            {({ isActive }) => (
                                <>
                                    <Home className={cn("w-5 h-5", isActive ? "stroke-[2.5px]" : "stroke-2")} />
                                    <span className="text-[10px] font-medium">Home</span>
                                </>
                            )}
                        </NavLink>

                        <NavLink to="/companion" className={({ isActive }) => cn("flex flex-col items-center gap-1 p-2 transition-colors", isActive ? "text-primary stroke-[2.5px]" : "text-slate-400 stroke-[2px]")}>
                            {({ isActive }) => (
                                <>
                                    <MessageCircle className={cn("w-5 h-5", isActive ? "stroke-[2.5px]" : "stroke-2")} />
                                    <span className="text-[10px] font-medium">Sammy</span>
                                </>
                            )}
                        </NavLink>

                        <NavLink to="/insights" className={({ isActive }) => cn("flex flex-col items-center gap-1 p-2 transition-colors", isActive ? "text-primary stroke-[2.5px]" : "text-slate-400 stroke-[2px]")}>
                            {({ isActive }) => (
                                <>
                                    <TrendingUp className={cn("w-5 h-5", isActive ? "stroke-[2.5px]" : "stroke-2")} />
                                    <span className="text-[10px] font-medium">Insights</span>
                                </>
                            )}
                        </NavLink>
                    </div>
                </nav>
            </div>
        </div>
    );
}
