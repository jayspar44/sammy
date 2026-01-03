import { Home, MessageCircle, BarChart3 } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';

const NavItem = ({ to, icon: Icon, label }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            clsx(
                "flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-200",
                isActive ? "text-primary scale-105" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            )
        }
    >
        {({ isActive }) => (
            <>
                <Icon
                    className={clsx(
                        "w-6 h-6 mb-1 transition-all",
                        isActive && "fill-current"
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                />
                <span className="text-[10px] font-medium tracking-wide">{label}</span>
            </>
        )}
    </NavLink>
);

export const Navbar = () => {
    return (
        <nav className="absolute bottom-4 left-4 right-4 bg-white/80 backdrop-blur-lg border-t border-slate-100 pb-safe pt-2 px-6 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between h-16 max-w-sm mx-auto">
                <NavItem to="/" icon={Home} label="Home" />
                <div className="flex flex-col items-center gap-1 p-2">
                    <NavLink to="/companion" className={({ isActive }) => clsx(
                        "flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-transform active:scale-95 -mt-7",
                        isActive ? "bg-primary text-white ring-4 ring-primary/20" : "bg-white text-primary border border-slate-100"
                    )}>
                        <MessageCircle className="w-7 h-7 fill-current" />
                    </NavLink>
                    <span className="text-[10px] font-medium tracking-wide text-slate-400">Sammy</span>
                </div>
                <NavItem to="/insights" icon={BarChart3} label="Insights" />
            </div>
        </nav>
    );
};
