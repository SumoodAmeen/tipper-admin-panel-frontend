import { useAuth } from '../features/auth/AuthContext';
import calendar from '../assets/dashboard/calendar.png';
import bell from '../assets/dashboard/bell.png';

const getInitials = (name = '') => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
};

const getFormattedDate = () => {
    const now = new Date();
    const date = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const day = now.toLocaleDateString('en-US', { weekday: 'long' });
    return `${date} (${day})`;
};

const Navbar = () => {
    const { user } = useAuth();

    const displayName = user?.username || 'Admin';
    const role = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) + ' User' : 'Admin User';
    const initials = getInitials(displayName);

    return (
        <header className="h-[64px] bg-white border-b border-[#E2E8F0] flex items-center justify-between px-6 flex-shrink-0">

            {/* Date */}
            <div className="flex items-center gap-2 text-[#64748B]">
                <img src={calendar} alt="Calendar" className="w-[9.99px] h-[11.1px] object-contain" />
                <span className="text-[14px] font-medium">{getFormattedDate()}</span>
            </div>

            {/* Right — Bell + User */}
            <div className="flex items-center gap-5">

                {/* Notification bell */}
                <button className="relative p-1">
                    <img src={bell} alt="Bell" className="w-[15.55px] h-[19.44px] object-contain" />
                    <span className="absolute -top-0.5 -right-0.5 w-[15px] h-[15px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        3
                    </span>
                </button>

                {/* Divider */}
                <div className="w-px h-7 bg-[#E2E8F0]" />

                {/* User info + avatar */}
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-[14px] font-bold text-[#0F172A] leading-tight">{displayName}</p>
                        <p className="text-[12px] text-[#64748B] font-medium">{role}</p>
                    </div>
                    <div className="w-[38px] h-[38px] rounded-full bg-[#FDC63A] flex items-center justify-center flex-shrink-0">
                        <span className="text-[13px] font-bold text-[#0F172A]">{initials}</span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
