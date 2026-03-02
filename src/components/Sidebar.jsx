import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Gavel,
    Truck,
    Handshake,
    Users,
    CreditCard,
    ShieldCheck,
    Headphones,
    Tag,
} from 'lucide-react';
import logo from '../assets/common/logo.png';

const navItems = [
    { label: 'Dashboard',           icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Bid Management',      icon: Gavel,           path: '/bid-management' },
    { label: 'Order Management',    icon: Truck,           path: '/order-management' },
    { label: 'Partner Management',  icon: Handshake,       path: '/partner-management' },
    { label: 'Customer Management', icon: Users,           path: '/customer-management' },
    { label: 'Payments',            icon: CreditCard,      path: '/payments' },
    { label: 'Driver Verification', icon: ShieldCheck,     path: '/driver-verification' },
    { label: 'Support',             icon: Headphones,      path: '/support' },
    { label: 'Promotions',          icon: Tag,             path: '/promotions' },
];

const Sidebar = () => {
    return (
        <aside className="w-[240px] min-h-screen bg-[#1A1A0E] flex flex-col flex-shrink-0">

            {/* Logo */}
            <div className="px-5 py-6 flex items-center gap-3">
                <div className="bg-[#FDC63A] rounded-[10px] w-[44px] h-[44px] flex items-center justify-center flex-shrink-0">
                    <img src={logo} alt="Tipper" className="w-8 h-8 object-contain" />
                </div>
                <div>
                    <p className="text-white font-bold text-[16px] leading-tight">Tipper App</p>
                    <p className="text-[#8a8a6a] text-[10px] font-semibold tracking-widest uppercase">Admin Panel</p>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 pt-2 space-y-0.5">
                {navItems.map(({ label, icon: Icon, path }) => (
                    <NavLink
                        key={path}
                        to={path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-[8px] text-[14px] font-semibold transition-colors ${
                                isActive
                                    ? 'bg-[#FDC63A] text-[#0F172A]'
                                    : 'text-[#d4d4aa] hover:bg-white/10 hover:text-white'
                            }`
                        }
                    >
                        <Icon size={18} strokeWidth={2} />
                        {label}
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;
