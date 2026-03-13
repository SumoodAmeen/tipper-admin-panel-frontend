import { NavLink } from 'react-router-dom';
import bid from '../assets/dashboard/bid.png';
import logo from '../assets/common/logo.png';
import dashboardIcon from '../assets/dashboard/dashboard.png';
import orderIcon from '../assets/dashboard/order.png';
import partnerIcon from '../assets/dashboard/partner.png';
import customerIcon from '../assets/dashboard/customer.png';
import paymentIcon from '../assets/dashboard/payment.png';
import driverIcon from '../assets/dashboard/driver.png';
import supportIcon from '../assets/dashboard/support.png';
import promotionsIcon from '../assets/dashboard/promotions.png';

const navItems = [
    { label: 'Dashboard', imgIcon: dashboardIcon, path: '/dashboard' },
    { label: 'Bid Management', imgIcon: bid, path: '/bid-management' },
    { label: 'Order Management', imgIcon: orderIcon, path: '/order-management' },
    { label: 'Partner Management', imgIcon: partnerIcon, path: '/partner-management' },
    { label: 'Customer Management', imgIcon: customerIcon, path: '/customer-management' },
    { label: 'Payments', imgIcon: paymentIcon, path: '/payments' },
    { label: 'Driver Verification', imgIcon: driverIcon, path: '/driver-verification' },
    { label: 'Support', imgIcon: supportIcon, path: '/support' },
    { label: 'Promotions', imgIcon: promotionsIcon, path: '/promotions' },
];

const Sidebar = () => {
    return (
        <aside className="w-[288px] min-h-screen bg-[#1A1A0E] flex flex-col flex-shrink-0">

            {/* Logo */}
            <div className="px-5 py-6 flex items-center gap-3">
                <div className="bg-[#FDC63A] rounded-[8px] w-[40.02px] h-[40px] flex items-center justify-center flex-shrink-0">
                    <img src={logo} alt="Tipper" className="w-[40px] h-[40px] object-contain" />
                </div>
                <div>
                    <p className="text-[#FFFFFF] font-bold text-[18px] leading-tight">Tipper App</p>
                    <p className="text-[#94A3B8] text-[12px] font-semibold tracking-widest uppercase">Admin Panel</p>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 pt-2 space-y-0.5">
                {navItems.map(({ label, imgIcon, lucideIcon: LucideIcon, path }) => (
                    <NavLink
                        key={path}
                        to={path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-[8px] text-[16px] font-semibold transition-colors ${isActive
                                ? 'bg-[#FDC63A] text-[#1C180C]'
                                : 'text-[#CBD5E1] hover:bg-white/10 hover:text-white'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                {imgIcon ? (
                                    <img
                                        src={imgIcon}
                                        alt={label}
                                        className="w-[18px] h-[18px] object-contain"
                                        style={{ filter: isActive ? 'brightness(0)' : 'brightness(0) invert(1)' }}
                                    />
                                ) : (
                                    <LucideIcon size={18} strokeWidth={2} />
                                )}
                                {label}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;
