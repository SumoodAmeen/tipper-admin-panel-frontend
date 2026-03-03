import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAdminDashboard, fetchOrderOverview } from '../dashboardApi';
import cartIcon from '../../../assets/dashboard/cart.png';
import boardIcon from '../../../assets/dashboard/board.png';
import timerIcon from '../../../assets/dashboard/timer.png';
import checkIcon from '../../../assets/dashboard/check.png';
import truckIcon from '../../../assets/dashboard/truck.png';
import userIcon from '../../../assets/dashboard/user.png';

const statCards = (data) => [
    {
        label: 'TOTAL ORDERS',
        value: data?.totalOrders ?? '--',
        icon: cartIcon,
        iconBg: 'bg-[#F288331A]',
        borderColor: 'border-l-[#FDC63A]',
    },
    {
        label: 'ACTIVE ORDERS',
        value: data?.activeOrders ?? '--',
        icon: boardIcon,
        iconBg: 'bg-[#FFFAEC]',
        borderColor: 'border-l-[#FDC63A]',
    },
    {
        label: 'WAITING CONFIRM',
        value: data?.waitingForConfirmation ?? '--',
        icon: timerIcon,
        iconBg: 'bg-[#FFF1F2]',
        borderColor: 'border-l-[#FDC63A]',
    },
    {
        label: 'DELIVERED',
        value: data?.deliveredOrders ?? '--',
        icon: checkIcon,
        iconBg: 'bg-[#0596691A]',
        borderColor: 'border-l-[#FDC63A]',
    },
    {
        label: 'ACTIVE DRIVERS',
        value: data?.activePartners?.onlineDrivers ?? '--',
        icon: truckIcon,
        iconBg: 'bg-[#EA580C1A]',
        borderColor: 'border-l-[#FDC63A]',
    },
    {
        label: 'ACTIVE DEALERS',
        value: data?.activePartners?.onlineDealers ?? '--',
        icon: userIcon,
        iconBg: 'bg-[#F8FAFC]',
        borderColor: 'border-l-[#FDC63A]',
    },
];

const STATUS_CONFIG = {
    requested: { label: 'Order Received', bg: 'bg-amber-50', text: 'text-amber-600' },
    bidding: { label: 'Bidding', bg: 'bg-orange-50', text: 'text-orange-500' },
    confirmed: { label: 'Confirmed', bg: 'bg-blue-50', text: 'text-blue-600' },
    assigned: { label: 'Assigned', bg: 'bg-sky-50', text: 'text-sky-600' },
    out_for_delivery: { label: 'Out For Delivery', bg: 'bg-sky-50', text: 'text-sky-600' },
    delivered: { label: 'Delivered', bg: 'bg-green-50', text: 'text-green-600' },
    cancelled: { label: 'Cancelled', bg: 'bg-red-50', text: 'text-red-500' },
};

const getQuantity = (order) => {
    const { vehicle, material } = order;
    if (vehicle?.vehicleCapacity && vehicle?.numberOfLoads) {
        return `${vehicle.vehicleCapacity} X ${vehicle.numberOfLoads}`;
    }
    if (material?.quantity && material?.unit) {
        return `${material.quantity} ${material.unit}`;
    }
    return '--';
};

const getAmount = (order) => {
    const amount = order.finalAmount || order.estimatedAmount;
    if (!amount) return '--';
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
};

const TABLE_COLS = ['ORDER ID', 'PARTNER', 'MATERIAL', 'QUANTITY', 'AMOUNT', 'STATUS', 'ACTION'];

const DashboardPage = () => {
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState(null);
    const [orders, setOrders] = useState([]);
    const [statsLoading, setStatsLoading] = useState(true);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAdminDashboard()
            .then(setDashboardData)
            .catch((err) => setError(err.message))
            .finally(() => setStatsLoading(false));

        fetchOrderOverview()
            .then((data) => setOrders(data.orders.slice(0, 4)))
            .catch((err) => setError(err.message))
            .finally(() => setOrdersLoading(false));
    }, []);

    const cards = statCards(dashboardData);

    return (
        <div>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-3 gap-5 mb-6">
                {cards.map((card) => (
                    <div
                        key={card.label}
                        className={`bg-white rounded-[12px] max-h-[152px] p-5 border-l-4 ${card.borderColor} shadow-sm`}
                    >
                        <div className={`w-[40px] h-[40px] rounded-[8px] ${card.iconBg} flex items-center justify-center mb-4`}>
                            <img src={card.icon} alt={card.label} className="w-4 h-4 object-contain" />
                        </div>
                        <p className="text-[12px] font-semibold text-[#64748B] tracking-widest uppercase mb-1.5">
                            {card.label}
                        </p>
                        <p className="text-[24px] font-bold text-[#1C180C] leading-tight">
                            {statsLoading ? (
                                <span className="inline-block w-16 h-7 bg-slate-100 animate-pulse rounded" />
                            ) : (
                                typeof card.value === 'number' ? card.value.toLocaleString() : card.value
                            )}
                        </p>
                    </div>
                ))}
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-[12px] shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-[#F1F5F9]">
                    <h2 className="text-[18px] font-bold text-[#0F172A]">Recent Orders</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[#F1F5F9]">
                                {TABLE_COLS.map((col) => (
                                    <th
                                        key={col}
                                        className="px-6 py-3 text-left text-[12px] font-bold text-[#94A3B8] tracking-widest uppercase"
                                    >
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {ordersLoading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i} className="border-b border-[#F8FAFC]">
                                        {TABLE_COLS.map((col) => (
                                            <td key={col} className="px-6 py-4">
                                                <span className="inline-block w-24 h-4 bg-slate-100 animate-pulse rounded" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center text-[#94A3B8] text-sm">
                                        No orders found
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => {
                                    const status = STATUS_CONFIG[order.status] || { label: order.status, bg: 'bg-slate-100', text: 'text-slate-500' };
                                    return (
                                        <tr key={order._id} className="border-b border-[#F8FAFC] hover:bg-[#FAFAFA] transition-colors">
                                            <td className="px-6 py-4 text-[14px] font-bold text-[#0F172A]">
                                                #{order.orderNumber}
                                            </td>
                                            <td className="px-6 py-4 text-[14px] text-[#475569] capitalize">
                                                {order.assignedPartner?.partnerType || '--'}
                                            </td>
                                            <td className="px-6 py-4 text-[14px] text-[#475569]">
                                                {order.material?.materialName || '--'}
                                            </td>
                                            <td className="px-6 py-4 text-[14px] text-[#475569]">
                                                {getQuantity(order)}
                                            </td>
                                            <td className="px-6 py-4 text-[14px] font-semibold text-[#0F172A]">
                                                {getAmount(order)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-[12px] font-semibold ${status.bg} ${status.text}`}>
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => navigate(`/order-management`)}
                                                    className="px-4 py-1.5 bg-[#FDC63A] text-[#0F172A] text-[12px] font-bold rounded-[6px] hover:bg-[#fbbf24] transition-colors cursor-pointer"
                                                >
                                                    Details
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* View All Orders */}
                <div className="px-6 py-5 flex justify-center">
                    <button
                        onClick={() => navigate('/order-management')}
                        className="px-8 py-2.5 bg-[#FDC63A] text-[#0F172A] text-[14px] font-bold rounded-[8px] hover:bg-[#fbbf24] transition-colors cursor-pointer"
                    >
                        View All Orders
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
