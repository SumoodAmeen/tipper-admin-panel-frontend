import { useEffect, useState } from 'react';
import { fetchOrders } from '../orderApi';
import OrderDetailModal from '../components/OrderDetailModal';
import excelIcon from '../../../assets/order/excel.png';

const STATUS_CONFIG = {
    requested: { label: 'Requested', bg: 'bg-slate-100', text: 'text-slate-500' },
    bidding: { label: 'Order Received', bg: 'bg-amber-50', text: 'text-amber-600' },
    assigned: { label: 'Assigned', bg: 'bg-purple-50', text: 'text-purple-600' },
    confirmed: { label: 'In Transit', bg: 'bg-blue-50', text: 'text-blue-500' },
    out_for_delivery: { label: 'Out for Delivery', bg: 'bg-indigo-50', text: 'text-indigo-600' },
    delivered: { label: 'Delivered', bg: 'bg-green-50', text: 'text-green-600' },
    cancelled: { label: 'Cancelled', bg: 'bg-red-50', text: 'text-red-500' },
    rejected: { label: 'Rejected', bg: 'bg-red-50', text: 'text-red-500' },
    expired: { label: 'Expired', bg: 'bg-slate-50', text: 'text-slate-400' },
};

const TABLE_COLS = ['ORDER ID', 'PARTNER', 'MATERIAL', 'QUANTITY', 'AMOUNT', 'STATUS', 'ACTION'];

const LIMIT = 10;


const formatAmount = (order) => {
    const amount = order.finalAmount > 0 ? order.finalAmount : order.estimatedAmount;
    if (!amount) return '--';
    return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatQuantity = (order) => {
    if (order.quantity) return String(order.quantity);
    return '--';
};

const OrderManagementPage = () => {
    const [orders, setOrders] = useState([]);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [pagination, setPagination] = useState({ totalCount: 0, totalPages: 1, currentPage: 1 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('confirmed,assigned,out_for_delivery,delivered,cancelled,rejected');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [page, setPage] = useState(1);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await fetchOrders({ page, limit: LIMIT, search, status, from, to });
                setOrders(data.orders ?? []);
                setPagination(data.pagination ?? { totalCount: 0, totalPages: 1, currentPage: 1 });
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        load();
        const interval = setInterval(load, 20 * 1000);
        return () => clearInterval(interval);
    }, [page, search, status, from, to]);

    const handleStatusChange = (e) => {
        setStatus(e.target.value);
        setPage(1);
    };

    const handleFromChange = (e) => {
        setFrom(e.target.value);
        setPage(1);
    };

    const handleToChange = (e) => {
        setTo(e.target.value);
        setPage(1);
    };

    const { totalCount, totalPages, currentPage } = pagination;
    const showingFrom = totalCount === 0 ? 0 : (currentPage - 1) * LIMIT + 1;
    const showingTo = Math.min(currentPage * LIMIT, totalCount);

    const renderPageButtons = () => {
        const maxVisible = 3;
        let start = Math.max(1, currentPage - 1);
        let end = Math.min(totalPages, start + maxVisible - 1);
        if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);

        const pages = [];
        for (let i = start; i <= end; i++) pages.push(i);

        return (
            <div className="flex items-center gap-1">
                <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-8 h-8 flex items-center justify-center rounded border border-[#E2E8F0] text-[#64748B] text-[16px] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    ‹
                </button>
                {pages.map((p) => (
                    <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 flex items-center justify-center rounded text-[14px] font-semibold transition-colors ${
                            p === currentPage
                                ? 'bg-[#FDC63A] text-[#0F172A]'
                                : 'border border-[#E2E8F0] text-[#64748B] hover:bg-slate-50'
                        }`}
                    >
                        {p}
                    </button>
                ))}
                <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="w-8 h-8 flex items-center justify-center rounded border border-[#E2E8F0] text-[#64748B] text-[16px] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    ›
                </button>
            </div>
        );
    };

    return (
        <div>
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-[30px] font-bold text-[#0F172A]">Order Management</h1>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-[#FDC63A] text-[#0F172A] text-[14px] font-bold rounded-[8px] hover:bg-[#fbbf24] transition-colors cursor-pointer">
                    <img src={excelIcon} alt="excel" width="16" height="16" />
                    Export as XL Sheet
                </button>
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            {/* Filters */}
            <div className="flex items-center gap-4 mb-6">
                {/* Search */}
                <div className="relative flex-1 max-w-[420px]">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Search by Order ID, Customer, or Partner..."
                        className="w-full pl-10 pr-4 py-2.5 border border-[#E2E8F0] rounded-[8px] text-[14px] text-[#475569] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#FDC63A]/50 focus:border-[#FDC63A] bg-white"
                    />
                </div>

                {/* From date */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                    </div>
                    <input
                        type="date"
                        value={from}
                        onChange={handleFromChange}
                        className="pl-9 pr-3 py-2.5 border border-[#E2E8F0] rounded-[8px] text-[14px] text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#FDC63A]/50 focus:border-[#FDC63A] bg-white"
                    />
                </div>

                <span className="text-[#94A3B8] font-medium">–</span>

                {/* To date */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                    </div>
                    <input
                        type="date"
                        value={to}
                        onChange={handleToChange}
                        className="pl-9 pr-3 py-2.5 border border-[#E2E8F0] rounded-[8px] text-[14px] text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#FDC63A]/50 focus:border-[#FDC63A] bg-white"
                    />
                </div>

                {/* Status dropdown */}
                <div className="relative">
                    <select
                        value={status}
                        onChange={handleStatusChange}
                        className="appearance-none pl-4 pr-9 py-2.5 border border-[#E2E8F0] rounded-[8px] text-[14px] text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#FDC63A]/50 focus:border-[#FDC63A] bg-white min-w-[140px] cursor-pointer"
                    >
                        <option value="confirmed,assigned,out_for_delivery,delivered,cancelled,rejected">All</option>
                        <option value="assigned">Assigned</option>
                        <option value="confirmed">In Transit</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="rejected">Rejected</option>
                        <option value="expired">Expired</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[12px] shadow-sm overflow-hidden">
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
                            {loading ? (
                                Array.from({ length: LIMIT }).map((_, i) => (
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
                                    const statusCfg = STATUS_CONFIG[order.status] || {
                                        label: order.status,
                                        bg: 'bg-slate-100',
                                        text: 'text-slate-500',
                                    };
                                    const partnerType = order.assignedPartner?.partnerType;
                                    const partnerLabel = partnerType
                                        ? partnerType.charAt(0).toUpperCase() + partnerType.slice(1)
                                        : '--';

                                    return (
                                        <tr key={order._id} className="border-b border-[#F8FAFC] hover:bg-[#FAFAFA] transition-colors">
                                            <td className="px-6 py-4 text-[14px] font-bold text-[#0F172A]">
                                                #{order.orderNumber}
                                            </td>
                                            <td className="px-6 py-4 text-[14px] text-[#475569]">
                                                {partnerLabel}
                                            </td>
                                            <td className="px-6 py-4 text-[14px] text-[#475569]">
                                                {order.material?.materialName ?? '--'}
                                            </td>
                                            <td className="px-6 py-4 text-[14px] text-[#475569]">
                                                {formatQuantity(order)}
                                            </td>
                                            <td className="px-6 py-4 text-[14px] font-semibold text-[#0F172A]">
                                                {formatAmount(order)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-[12px] font-semibold ${statusCfg.bg} ${statusCfg.text}`}>
                                                    {statusCfg.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => setSelectedOrderId(order._id)}
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

                {/* Pagination */}
                {!loading && orders.length > 0 && (
                    <div className="px-6 py-4 flex items-center justify-between border-t border-[#F1F5F9]">
                        <p className="text-[14px] text-[#64748B]">
                            Showing {showingFrom} to {showingTo} of {totalCount} orders
                        </p>
                        {renderPageButtons()}
                    </div>
                )}
            </div>

            {selectedOrderId && (
                <OrderDetailModal
                    orderId={selectedOrderId}
                    onClose={() => setSelectedOrderId(null)}
                />
            )}
        </div>
    );
};

export default OrderManagementPage;
